package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"
	"strconv"
)

// Estruturas para as respostas da API
type AuthResponse struct {
	Token     string    `json:"token"`
	User      UserData  `json:"user"`
	ExpiresAt time.Time `json:"expires_at"`
}

type UserData struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	TenantID  string `json:"tenant_id"`
	Role      string `json:"role"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type APIErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// generateUniqueEmail gera um email único baseado no timestamp
func generateUniqueEmail(prefix string) string {
	timestamp := strconv.FormatInt(time.Now().UnixNano(), 10)
	return fmt.Sprintf("%s_%s@example.com", prefix, timestamp)
}
func makeHTTPRequest(t *testing.T, method, url string, body map[string]interface{}, token string) (*http.Response, []byte) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("Erro ao serializar JSON: %v", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		t.Fatalf("Erro ao criar requisição: %v", err)
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Erro ao fazer requisição: %v", err)
	}

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Erro ao ler resposta: %v", err)
	}
	resp.Body.Close()

	return resp, responseBody
}

// TestAPIHealth testa o endpoint de health
func TestAPIHealth(t *testing.T) {
	baseURL := "http://localhost:9090"

	resp, body := makeHTTPRequest(t, "GET", baseURL+"/api/health", nil, "")

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Esperado status 200, obtido %d", resp.StatusCode)
	}

	if !bytes.Contains(body, []byte("healthy")) {
		t.Errorf("Resposta não contém 'healthy': %s", string(body))
	}

	fmt.Println("✅ Teste de Health passou")
}

// TestAPIRegister testa o registro de usuário
func TestAPIRegister(t *testing.T) {
	baseURL := "http://localhost:9090"

	email := generateUniqueEmail("testapi")
	registerData := map[string]interface{}{
		"email":       email,
		"password":    "password123",
		"first_name":  "Test",
		"last_name":   "API",
		"tenant_name": "Test API Company",
		"plan":        "free",
	}

	resp, body := makeHTTPRequest(t, "POST", baseURL+"/api/auth/register", registerData, "")

	if resp.StatusCode != http.StatusCreated {
		t.Errorf("Esperado status 201, obtido %d. Resposta: %s", resp.StatusCode, string(body))
		return
	}

	var authResp AuthResponse
	if err := json.Unmarshal(body, &authResp); err != nil {
		t.Errorf("Erro ao deserializar resposta: %v", err)
		return
	}

	if authResp.Token == "" {
		t.Error("Token não foi retornado")
	}

	if authResp.User.Email != email {
		t.Errorf("Email incorreto: esperado %s, obtido %s", email, authResp.User.Email)
	}

	if authResp.User.Role != "owner" {
		t.Errorf("Role incorreto: esperado owner, obtido %s", authResp.User.Role)
	}

	fmt.Printf("✅ Teste de Registro passou - Token: %s...\n", authResp.Token[:30])
}

// TestAPILogin testa o login
func TestAPILogin(t *testing.T) {
	baseURL := "http://localhost:9090"

	// Primeiro registrar
	registerData := map[string]interface{}{
		"email":       "logintest@example.com",
		"password":    "password123",
		"first_name":  "Login",
		"last_name":   "Test",
		"tenant_name": "Login Test Company",
		"plan":        "free",
	}

	makeHTTPRequest(t, "POST", baseURL+"/api/auth/register", registerData, "")

	// Agora fazer login
	loginData := map[string]interface{}{
		"email":    "logintest@example.com",
		"password": "password123",
	}

	resp, body := makeHTTPRequest(t, "POST", baseURL+"/api/auth/login", loginData, "")

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Esperado status 200, obtido %d. Resposta: %s", resp.StatusCode, string(body))
		return
	}

	var authResp AuthResponse
	if err := json.Unmarshal(body, &authResp); err != nil {
		t.Errorf("Erro ao deserializar resposta: %v", err)
		return
	}

	if authResp.Token == "" {
		t.Error("Token não foi retornado no login")
	}

	fmt.Println("✅ Teste de Login passou")
}

// TestAPIUnauthorized testa acesso não autorizado
func TestAPIUnauthorized(t *testing.T) {
	baseURL := "http://localhost:9090"

	resp, body := makeHTTPRequest(t, "GET", baseURL+"/api/tenants", nil, "")

	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("Esperado status 401, obtido %d. Resposta: %s", resp.StatusCode, string(body))
		return
	}

	var errResp APIErrorResponse
	if err := json.Unmarshal(body, &errResp); err != nil {
		t.Errorf("Erro ao deserializar resposta de erro: %v", err)
		return
	}

	if errResp.Code != 401 {
		t.Errorf("Código de erro incorreto: esperado 401, obtido %d", errResp.Code)
	}

	fmt.Println("✅ Teste de Não Autorizado passou")
}

// TestAPITenantOperations testa operações de tenant
func TestAPITenantOperations(t *testing.T) {
	baseURL := "http://localhost:9090"

	// Registrar usuário para obter token
	email := generateUniqueEmail("tenantops")
	registerData := map[string]interface{}{
		"email":       email,
		"password":    "password123",
		"first_name":  "Tenant",
		"last_name":   "Ops",
		"tenant_name": "Tenant Ops Company",
		"plan":        "free",
	}

	resp, body := makeHTTPRequest(t, "POST", baseURL+"/auth/register", registerData, "")
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("Falha no registro: %d - %s", resp.StatusCode, string(body))
	}

	var authResp AuthResponse
	if err := json.Unmarshal(body, &authResp); err != nil {
		t.Fatalf("Erro ao deserializar resposta de registro: %v", err)
	}

	token := authResp.Token
	tenantID := authResp.User.TenantID

	// Testar listagem de tenants
	resp, body = makeHTTPRequest(t, "GET", baseURL+"/api/tenants", nil, token)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Falha ao listar tenants: %d - %s", resp.StatusCode, string(body))
		return
	}

	// Testar obter tenant específico
	resp, body = makeHTTPRequest(t, "GET", baseURL+"/api/tenants/"+tenantID, nil, token)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Falha ao obter tenant: %d - %s", resp.StatusCode, string(body))
		return
	}

	// Testar atualização de tenant
	updateData := map[string]interface{}{
		"name": "Updated Tenant Ops Company",
	}

	resp, body = makeHTTPRequest(t, "PUT", baseURL+"/api/tenants/"+tenantID, updateData, token)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Falha ao atualizar tenant: %d - %s", resp.StatusCode, string(body))
		return
	}

	fmt.Println("✅ Teste de Operações de Tenant passou")
}

// TestAPIBillingOperations testa operações de billing
func TestAPIBillingOperations(t *testing.T) {
	baseURL := "http://localhost:9090"

	// Registrar usuário para obter token
	email := generateUniqueEmail("billing")
	registerData := map[string]interface{}{
		"email":       email,
		"password":    "password123",
		"first_name":  "Billing",
		"last_name":   "Test",
		"tenant_name": "Billing Test Company",
		"plan":        "free",
	}

	resp, body := makeHTTPRequest(t, "POST", baseURL+"/auth/register", registerData, "")
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("Falha no registro: %d - %s", resp.StatusCode, string(body))
	}

	var authResp AuthResponse
	if err := json.Unmarshal(body, &authResp); err != nil {
		t.Fatalf("Erro ao deserializar resposta de registro: %v", err)
	}

	token := authResp.Token

	// Testar listagem de subscriptions
	resp, body = makeHTTPRequest(t, "GET", baseURL+"/api/billing/subscriptions", nil, token)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Falha ao listar subscriptions: %d - %s", resp.StatusCode, string(body))
		return
	}

	// Testar criação de subscription
	subData := map[string]interface{}{
		"plan":          "premium",
		"billing_cycle": "monthly",
	}

	resp, body = makeHTTPRequest(t, "POST", baseURL+"/api/billing/subscriptions", subData, token)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Falha ao criar subscription: %d - %s", resp.StatusCode, string(body))
		return
	}

	// Testar listagem de invoices
	resp, body = makeHTTPRequest(t, "GET", baseURL+"/api/billing/invoices", nil, token)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Falha ao listar invoices: %d - %s", resp.StatusCode, string(body))
		return
	}

	fmt.Println("✅ Teste de Operações de Billing passou")
}

// TestAPIIntegrationFlow testa um fluxo completo de integração
func TestAPIIntegrationFlow(t *testing.T) {
	baseURL := "http://localhost:9090"

	fmt.Println("🧪 Iniciando teste de fluxo de integração completo...")

	// 1. Verificar health
	resp, _ := makeHTTPRequest(t, "GET", baseURL+"/api/health", nil, "")
	if resp.StatusCode != http.StatusOK {
		t.Fatal("Backend não está saudável")
	}
	fmt.Println("   ✅ Health check passou")

	// 2. Registrar usuário
	email := generateUniqueEmail("integration")
	registerData := map[string]interface{}{
		"email":       email,
		"password":    "password123",
		"first_name":  "Integration",
		"last_name":   "Test",
		"tenant_name": "Integration Test Company",
		"plan":        "free",
	}

	resp, body := makeHTTPRequest(t, "POST", baseURL+"/api/auth/register", registerData, "")
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("Falha no registro: %d - %s", resp.StatusCode, string(body))
	}

	var authResp AuthResponse
	if err := json.Unmarshal(body, &authResp); err != nil {
		t.Fatalf("Erro ao deserializar resposta de registro: %v", err)
	}

	token := authResp.Token
	tenantID := authResp.User.TenantID
	fmt.Println("   ✅ Registro passou")

	// 3. Fazer login
	loginData := map[string]interface{}{
		"email":    email,
		"password": "password123",
	}

	resp, _ = makeHTTPRequest(t, "POST", baseURL+"/api/auth/login", loginData, "")
	if resp.StatusCode != http.StatusOK {
		t.Fatal("Falha no login")
	}
	fmt.Println("   ✅ Login passou")

	// 4. Refresh token
	resp, _ = makeHTTPRequest(t, "POST", baseURL+"/api/auth/refresh", nil, token)
	if resp.StatusCode != http.StatusOK {
		t.Fatal("Falha no refresh")
	}
	fmt.Println("   ✅ Refresh passou")

	// 5. Operações de tenant
	resp, _ = makeHTTPRequest(t, "GET", baseURL+"/api/tenants", nil, token)
	if resp.StatusCode != http.StatusOK {
		t.Fatal("Falha ao listar tenants")
	}

	updateData := map[string]interface{}{
		"name": "Updated Integration Company",
	}
	resp, _ = makeHTTPRequest(t, "PUT", baseURL+"/api/tenants/"+tenantID, updateData, token)
	if resp.StatusCode != http.StatusOK {
		t.Fatal("Falha ao atualizar tenant")
	}
	fmt.Println("   ✅ Operações de tenant passaram")

	// 6. Operações de billing
	resp, _ = makeHTTPRequest(t, "GET", baseURL+"/api/billing/subscriptions", nil, token)
	if resp.StatusCode != http.StatusOK {
		t.Fatal("Falha ao listar subscriptions")
	}

	subData := map[string]interface{}{
		"plan":          "premium",
		"billing_cycle": "monthly",
	}
	resp, _ = makeHTTPRequest(t, "POST", baseURL+"/api/billing/subscriptions", subData, token)
	if resp.StatusCode != http.StatusOK {
		t.Fatal("Falha ao criar subscription")
	}

	resp, _ = makeHTTPRequest(t, "GET", baseURL+"/api/billing/invoices", nil, token)
	if resp.StatusCode != http.StatusOK {
		t.Fatal("Falha ao listar invoices")
	}
	fmt.Println("   ✅ Operações de billing passaram")

	// 7. Testar webhook
	webhookData := map[string]interface{}{
		"type": "subscription.updated",
		"data": map[string]interface{}{
			"subscription_id": "test_sub_123",
			"status":          "active",
		},
	}
	resp, _ = makeHTTPRequest(t, "POST", baseURL+"/api/billing/webhooks", webhookData, "")
	if resp.StatusCode != http.StatusOK {
		t.Fatal("Falha no webhook")
	}
	fmt.Println("   ✅ Webhook passou")

	fmt.Println("🎉 Fluxo de integração completo passou com sucesso!")
}
