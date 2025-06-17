package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/eltonciatto/veloflux/internal/api"
	"github.com/eltonciatto/veloflux/internal/auth"
	"github.com/eltonciatto/veloflux/internal/billing"
	"github.com/eltonciatto/veloflux/internal/tenant"
)

// TestSuite contém os recursos necessários para os testes
type TestSuite struct {
	server         *httptest.Server
	api            *api.API
	authenticator  *auth.Authenticator
	tenantManager  *tenant.Manager
	billingManager *billing.Manager
	testJWTToken   string
	testUserID     string
	testTenantID   string
}

// setupTestSuite inicializa o ambiente de teste
func setupTestSuite(t *testing.T) *TestSuite {
	// Logger para testes
	logger, _ := zap.NewDevelopment()

	// Configurar Redis de teste (usando Redis local)
	redisURL := "redis://localhost:6379"
	if envRedis := os.Getenv("TEST_REDIS_URL"); envRedis != "" {
		redisURL = envRedis
	}

	// Inicializar managers
	authenticator := auth.NewAuthenticator("test-secret-key", 24*time.Hour, logger)
	tenantManager := tenant.NewManager(redisURL, logger)
	billingManager := billing.NewManager(redisURL, logger)

	// Criar API
	apiInstance := api.New(logger)
	apiInstance.SetAuthenticator(authenticator)
	apiInstance.SetTenantManager(tenantManager)
	apiInstance.SetBillingManager(billingManager)

	// Router de teste
	router := mux.NewRouter()
	apiInstance.RegisterRoutes(router)

	// Servidor de teste
	server := httptest.NewServer(router)

	return &TestSuite{
		server:         server,
		api:            apiInstance,
		authenticator:  authenticator,
		tenantManager:  tenantManager,
		billingManager: billingManager,
	}
}

// teardownTestSuite limpa o ambiente de teste
func (ts *TestSuite) teardownTestSuite() {
	ts.server.Close()
}

// makeRequest helper para fazer requisições HTTP
func (ts *TestSuite) makeRequest(t *testing.T, method, path string, body interface{}, token string) (*http.Response, []byte) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		require.NoError(t, err)
		reqBody = bytes.NewBuffer(jsonData)
	}

	url := ts.server.URL + path
	req, err := http.NewRequest(method, url, reqBody)
	require.NoError(t, err)

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	responseBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	resp.Body.Close()

	return resp, responseBody
}

// Estruturas para respostas da API
type RegisterResponse struct {
	Token     string    `json:"token"`
	User      UserInfo  `json:"user"`
	ExpiresAt time.Time `json:"expires_at"`
}

type UserInfo struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	TenantID  string `json:"tenant_id"`
	Role      string `json:"role"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type LoginResponse struct {
	Token     string    `json:"token"`
	User      UserInfo  `json:"user"`
	ExpiresAt time.Time `json:"expires_at"`
}

type ApiResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// TestHealthEndpoint testa o endpoint de health
func TestHealthEndpoint(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	resp, body := ts.makeRequest(t, "GET", "/health", nil, "")

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Contains(t, string(body), "healthy")
}

// TestUserRegistration testa o registro de usuário
func TestUserRegistration(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Dados de registro
	registerData := map[string]interface{}{
		"email":       "test@example.com",
		"password":    "password123",
		"first_name":  "Test",
		"last_name":   "User",
		"tenant_name": "Test Company",
		"plan":        "free",
	}

	resp, body := ts.makeRequest(t, "POST", "/auth/register", registerData, "")

	// Verificar status
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	// Parse da resposta
	var regResp RegisterResponse
	err := json.Unmarshal(body, &regResp)
	require.NoError(t, err)

	// Verificações
	assert.NotEmpty(t, regResp.Token)
	assert.Equal(t, "test@example.com", regResp.User.Email)
	assert.Equal(t, "owner", regResp.User.Role)
	assert.NotEmpty(t, regResp.User.UserID)
	assert.NotEmpty(t, regResp.User.TenantID)

	// Salvar dados para outros testes
	ts.testJWTToken = regResp.Token
	ts.testUserID = regResp.User.UserID
	ts.testTenantID = regResp.User.TenantID
}

// TestUserLogin testa o login de usuário
func TestUserLogin(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Primeiro registrar usuário
	registerData := map[string]interface{}{
		"email":       "login@example.com",
		"password":    "password123",
		"first_name":  "Login",
		"last_name":   "User",
		"tenant_name": "Login Company",
		"plan":        "free",
	}

	_, _ = ts.makeRequest(t, "POST", "/auth/register", registerData, "")

	// Agora testar login
	loginData := map[string]interface{}{
		"email":    "login@example.com",
		"password": "password123",
	}

	resp, body := ts.makeRequest(t, "POST", "/auth/login", loginData, "")

	// Verificar status
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Parse da resposta
	var loginResp LoginResponse
	err := json.Unmarshal(body, &loginResp)
	require.NoError(t, err)

	// Verificações
	assert.NotEmpty(t, loginResp.Token)
	assert.Equal(t, "login@example.com", loginResp.User.Email)
	assert.Equal(t, "owner", loginResp.User.Role)
}

// TestInvalidLogin testa login com credenciais inválidas
func TestInvalidLogin(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	loginData := map[string]interface{}{
		"email":    "invalid@example.com",
		"password": "wrongpassword",
	}

	resp, body := ts.makeRequest(t, "POST", "/auth/login", loginData, "")

	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)

	var errResp ErrorResponse
	err := json.Unmarshal(body, &errResp)
	require.NoError(t, err)

	assert.Contains(t, strings.ToLower(errResp.Message), "invalid")
}

// TestTokenRefresh testa o refresh de token
func TestTokenRefresh(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Registrar usuário para obter token
	registerData := map[string]interface{}{
		"email":       "refresh@example.com",
		"password":    "password123",
		"first_name":  "Refresh",
		"last_name":   "User",
		"tenant_name": "Refresh Company",
		"plan":        "free",
	}

	regResp, regBody := ts.makeRequest(t, "POST", "/auth/register", registerData, "")
	require.Equal(t, http.StatusCreated, regResp.StatusCode)

	var regData RegisterResponse
	err := json.Unmarshal(regBody, &regData)
	require.NoError(t, err)

	// Testar refresh
	resp, body := ts.makeRequest(t, "POST", "/auth/refresh", nil, regData.Token)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var refreshResp LoginResponse
	err = json.Unmarshal(body, &refreshResp)
	require.NoError(t, err)

	assert.NotEmpty(t, refreshResp.Token)
	assert.NotEqual(t, regData.Token, refreshResp.Token) // Token deve ser diferente
}

// TestUnauthorizedAccess testa acesso sem autenticação
func TestUnauthorizedAccess(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Tentar acessar endpoint protegido sem token
	resp, body := ts.makeRequest(t, "GET", "/api/tenants", nil, "")

	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)

	var errResp ErrorResponse
	err := json.Unmarshal(body, &errResp)
	require.NoError(t, err)

	assert.Contains(t, strings.ToLower(errResp.Message), "authorization")
}

// TestInvalidToken testa acesso com token inválido
func TestInvalidToken(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Tentar acessar endpoint protegido com token inválido
	resp, body := ts.makeRequest(t, "GET", "/api/tenants", nil, "invalid_token")

	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)

	var errResp ErrorResponse
	err := json.Unmarshal(body, &errResp)
	require.NoError(t, err)

	assert.Contains(t, strings.ToLower(errResp.Message), "invalid")
}

// TestListTenants testa a listagem de tenants
func TestListTenants(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Registrar usuário
	token := ts.registerTestUser(t, "tenants@example.com")

	// Listar tenants
	resp, body := ts.makeRequest(t, "GET", "/api/tenants", nil, token)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Verificar se retorna uma lista
	assert.Contains(t, string(body), "items")
	assert.Contains(t, string(body), "total_count")
}

// TestCreateSubscription testa a criação de subscription
func TestCreateSubscription(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Registrar usuário
	token := ts.registerTestUser(t, "billing@example.com")

	// Criar subscription
	subData := map[string]interface{}{
		"plan":          "premium",
		"billing_cycle": "monthly",
	}

	resp, body := ts.makeRequest(t, "POST", "/api/billing/subscriptions", subData, token)

	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var apiResp ApiResponse
	err := json.Unmarshal(body, &apiResp)
	require.NoError(t, err)

	assert.True(t, apiResp.Success)
	assert.Contains(t, apiResp.Message, "created")
}

// TestListSubscriptions testa a listagem de subscriptions
func TestListSubscriptions(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Registrar usuário
	token := ts.registerTestUser(t, "subslist@example.com")

	// Listar subscriptions
	resp, body := ts.makeRequest(t, "GET", "/api/billing/subscriptions", nil, token)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Verificar estrutura da resposta
	assert.Contains(t, string(body), "items")
	assert.Contains(t, string(body), "total_count")
}

// TestListInvoices testa a listagem de invoices
func TestListInvoices(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Registrar usuário
	token := ts.registerTestUser(t, "invoices@example.com")

	// Listar invoices
	resp, body := ts.makeRequest(t, "GET", "/api/billing/invoices", nil, token)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Verificar estrutura da resposta
	assert.Contains(t, string(body), "items")
	assert.Contains(t, string(body), "total_count")
}

// TestBillingWebhook testa o webhook de billing
func TestBillingWebhook(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// Dados do webhook
	webhookData := map[string]interface{}{
		"type": "subscription.updated",
		"data": map[string]interface{}{
			"subscription_id": "sub_test_123",
			"status":          "active",
		},
	}

	resp, body := ts.makeRequest(t, "POST", "/api/billing/webhooks", webhookData, "")

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var apiResp ApiResponse
	err := json.Unmarshal(body, &apiResp)
	require.NoError(t, err)

	assert.True(t, apiResp.Success)
	assert.Contains(t, apiResp.Message, "processed")
}

// Métodos auxiliares

// registerTestUser registra um usuário de teste e retorna o token
func (ts *TestSuite) registerTestUser(t *testing.T, email string) string {
	registerData := map[string]interface{}{
		"email":       email,
		"password":    "password123",
		"first_name":  "Test",
		"last_name":   "User",
		"tenant_name": "Test Company",
		"plan":        "free",
	}

	resp, body := ts.makeRequest(t, "POST", "/auth/register", registerData, "")
	require.Equal(t, http.StatusCreated, resp.StatusCode)

	var regResp RegisterResponse
	err := json.Unmarshal(body, &regResp)
	require.NoError(t, err)

	return regResp.Token
}

// TestMain configura o ambiente de teste
func TestMain(m *testing.M) {
	// Configurar variáveis de ambiente para teste
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("JWT_SECRET", "test-secret-key")

	// Executar testes
	code := m.Run()

	// Limpeza (se necessário)
	os.Exit(code)
}

// TestIntegrationFlow testa um fluxo completo de integração
func TestIntegrationFlow(t *testing.T) {
	ts := setupTestSuite(t)
	defer ts.teardownTestSuite()

	// 1. Registrar usuário
	registerData := map[string]interface{}{
		"email":       "integration@example.com",
		"password":    "password123",
		"first_name":  "Integration",
		"last_name":   "Test",
		"tenant_name": "Integration Company",
		"plan":        "free",
	}

	regResp, regBody := ts.makeRequest(t, "POST", "/auth/register", registerData, "")
	assert.Equal(t, http.StatusCreated, regResp.StatusCode)

	var regData RegisterResponse
	err := json.Unmarshal(regBody, &regData)
	require.NoError(t, err)

	token := regData.Token
	tenantID := regData.User.TenantID

	// 2. Fazer login
	loginData := map[string]interface{}{
		"email":    "integration@example.com",
		"password": "password123",
	}

	loginResp, _ := ts.makeRequest(t, "POST", "/auth/login", loginData, "")
	assert.Equal(t, http.StatusOK, loginResp.StatusCode)

	// 3. Listar tenants
	tenantsResp, _ := ts.makeRequest(t, "GET", "/api/tenants", nil, token)
	assert.Equal(t, http.StatusOK, tenantsResp.StatusCode)

	// 4. Obter tenant específico
	tenantResp, _ := ts.makeRequest(t, "GET", fmt.Sprintf("/api/tenants/%s", tenantID), nil, token)
	assert.Equal(t, http.StatusOK, tenantResp.StatusCode)

	// 5. Atualizar tenant
	updateData := map[string]interface{}{
		"name": "Updated Integration Company",
	}

	updateResp, _ := ts.makeRequest(t, "PUT", fmt.Sprintf("/api/tenants/%s", tenantID), updateData, token)
	assert.Equal(t, http.StatusOK, updateResp.StatusCode)

	// 6. Criar subscription
	subData := map[string]interface{}{
		"plan":          "premium",
		"billing_cycle": "monthly",
	}

	subResp, subBody := ts.makeRequest(t, "POST", "/api/billing/subscriptions", subData, token)
	assert.Equal(t, http.StatusCreated, subResp.StatusCode)

	var subData2 ApiResponse
	err = json.Unmarshal(subBody, &subData2)
	require.NoError(t, err)

	// 7. Listar subscriptions
	subsResp, _ := ts.makeRequest(t, "GET", "/api/billing/subscriptions", nil, token)
	assert.Equal(t, http.StatusOK, subsResp.StatusCode)

	// 8. Listar invoices
	invoicesResp, _ := ts.makeRequest(t, "GET", "/api/billing/invoices", nil, token)
	assert.Equal(t, http.StatusOK, invoicesResp.StatusCode)

	// 9. Refresh token
	refreshResp, _ := ts.makeRequest(t, "POST", "/auth/refresh", nil, token)
	assert.Equal(t, http.StatusOK, refreshResp.StatusCode)

	fmt.Println("✅ Fluxo de integração completo executado com sucesso!")
}
