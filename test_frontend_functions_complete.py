#!/usr/bin/env python3
"""
Teste abrangente de todas as funções do frontend VeloFlux
Verifica se todas as APIs estão sendo chamadas corretamente
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configurações
BASE_URL = "http://localhost"
FRONTEND_PORT = "3000"
BACKEND_PORT = "9090"
NGINX_PORT = "80"

# URLs para teste
FRONTEND_URL = f"{BASE_URL}:{FRONTEND_PORT}"
DIRECT_API_URL = f"{BASE_URL}:{BACKEND_PORT}"  # API direta
NGINX_BASE_URL = f"{BASE_URL}:{NGINX_PORT}"  # Via nginx

class FrontendTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_results = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def add_result(self, test_name, success, message="", data=None):
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        self.log(f"{status} {test_name}: {message}")

    def test_api_endpoint_basic_auth(self, method, endpoint, expected_status=200, via_nginx=True):
        """Testa um endpoint da API com Basic Auth"""
        try:
            # Credenciais do config
            auth = ('admin', 'VeloFlux2025!')
            
            if via_nginx:
                url = f"{NGINX_BASE_URL}/api{endpoint}"
            else:
                url = f"{DIRECT_API_URL}/api{endpoint}"
            
            response = self.session.request(
                method=method,
                url=url,
                auth=auth,
                timeout=10
            )
            
            success = response.status_code == expected_status
            return success, response
            
        except Exception as e:
            if via_nginx:
                return self.test_api_endpoint_basic_auth(method, endpoint, expected_status, via_nginx=False)
            return False, str(e)

    def test_api_endpoint(self, method, endpoint, headers=None, data=None, expected_status=200, via_nginx=True):
        """Testa um endpoint da API - preferencialmente via nginx, fallback para direto"""
        try:
            # Primeiro tenta via nginx (como o frontend faria)
            if via_nginx:
                url = f"{NGINX_BASE_URL}{endpoint}"
            else:
                # Fallback para API direta
                url = f"{DIRECT_API_URL}{endpoint}" if endpoint.startswith('/api') else f"{DIRECT_API_URL}/api{endpoint}"
            
            # Prepara headers
            request_headers = headers or {}
            if data and 'Content-Type' not in request_headers:
                request_headers['Content-Type'] = 'application/json'
            
            response = self.session.request(
                method=method,
                url=url,
                headers=request_headers,
                json=data if data else None,
                timeout=10
            )
            
            success = response.status_code == expected_status
            return success, response
            
        except Exception as e:
            # Se falhou via nginx, tenta direto
            if via_nginx:
                return self.test_api_endpoint(method, endpoint, headers, data, expected_status, via_nginx=False)
            return False, str(e)

    def test_auth_flow(self):
        """Testa o fluxo completo de autenticação"""
        self.log("=== TESTANDO FLUXO DE AUTENTICAÇÃO ===")
        
        # 1. Teste de registro
        register_data = {
            "email": f"test_{int(time.time())}@example.com",
            "password": "StrongPass123!",
            "first_name": "Test",
            "last_name": "User",
            "tenant_name": f"Test Tenant {int(time.time())}",
            "plan": "free"
        }
        
        success, response = self.test_api_endpoint(
            "POST", 
            "/auth/register", 
            data=register_data,
            expected_status=201
        )
        
        # Se usuário já existe (409), tenta com outro email
        if not success and hasattr(response, 'status_code') and response.status_code == 409:
            register_data["email"] = f"test_{int(time.time() * 1000)}@example.com"
            register_data["tenant_name"] = f"Test Tenant {int(time.time() * 1000)}"
            success, response = self.test_api_endpoint(
                "POST", 
                "/auth/register", 
                data=register_data,
                expected_status=201
            )
        
        if success:
            self.add_result("Registro de usuário", True, "Usuário registrado com sucesso")
            user_data = response.json()
            self.user_id = user_data.get("user_id")
        else:
            self.add_result("Registro de usuário", False, f"Falha no registro: {response}")
            return False

        # 2. Teste de login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        success, response = self.test_api_endpoint(
            "POST", 
            "/auth/login", 
            data=login_data
        )
        
        if success:
            self.add_result("Login de usuário", True, "Login realizado com sucesso")
            auth_data = response.json()
            self.token = auth_data.get("token")
        else:
            self.add_result("Login de usuário", False, f"Falha no login: {response}")
            return False

        # 3. Teste de validação de token (usando profile como proxy)
        headers = {"Authorization": f"Bearer {self.token}"}
        success, response = self.test_api_endpoint(
            "GET", 
            "/profile", 
            headers=headers
        )
        
        self.add_result("Validação de token", success, 
                       "Token válido" if success else f"Token inválido: {response}")

        # 4. Teste de profile (mesmo endpoint)
        self.add_result("Busca de perfil", success, 
                       "Perfil carregado" if success else f"Falha ao carregar perfil: {response}")

        return True

    def test_billing_functions(self):
        """Testa todas as funções de billing"""
        self.log("=== TESTANDO FUNÇÕES DE BILLING ===")
        
        if not self.token:
            self.add_result("Billing - Pré-requisito", False, "Token não disponível")
            return False

        headers = {"Authorization": f"Bearer {self.token}"}

        # 1. Teste de listagem de assinaturas
        success, response = self.test_api_endpoint(
            "GET", 
            "/billing/subscriptions", 
            headers=headers
        )
        
        subscriptions_loaded = success
        subscriptions_data = response.json() if success else None
        
        self.add_result("Billing - Listagem de assinaturas", success, 
                       "Assinaturas carregadas" if success else f"Falha: {response}")

        # 2. Teste de criação de assinatura
        subscription_data = {
            "plan": "pro",
            "billing_cycle": "monthly"
        }
        
        success, response = self.test_api_endpoint(
            "POST", 
            "/billing/subscriptions", 
            headers=headers,
            data=subscription_data,
            expected_status=200  # Backend retorna 200, não 201
        )
        
        subscription_created = success
        new_subscription = response.json() if success else None
        
        self.add_result("Billing - Criação de assinatura", success, 
                       "Assinatura criada" if success else f"Falha: {response}")

        # 3. Teste de atualização de assinatura (se criada)
        if subscription_created and new_subscription:
            subscription_id = new_subscription.get("subscription_id")
            if subscription_id:
                update_data = {"plan": "enterprise"}
                
                success, response = self.test_api_endpoint(
                    "PUT", 
                    f"/billing/subscriptions/{subscription_id}", 
                    headers=headers,
                    data=update_data
                )
                
                self.add_result("Billing - Atualização de assinatura", success, 
                               "Assinatura atualizada" if success else f"Falha: {response}")

        # 4. Teste de listagem de faturas
        success, response = self.test_api_endpoint(
            "GET", 
            "/billing/invoices", 
            headers=headers
        )
        
        self.add_result("Billing - Listagem de faturas", success, 
                       "Faturas carregadas" if success else f"Falha: {response}")

        # 5. Teste de webhook (simulação)
        webhook_data = {
            "type": "invoice.payment_succeeded",
            "data": {
                "object": {
                    "id": "inv_test123",
                    "subscription": "sub_test123",
                    "amount_paid": 2900,
                    "status": "paid"
                }
            }
        }
        
        success, response = self.test_api_endpoint(
            "POST", 
            "/billing/webhooks", 
            data=webhook_data
        )
        
        self.add_result("Billing - Webhook", success, 
                       "Webhook processado" if success else f"Falha: {response}")

        return True

    def test_tenant_functions(self):
        """Testa funções de tenant/multi-tenancy"""
        self.log("=== TESTANDO FUNÇÕES DE TENANT ===")
        
        if not self.token:
            self.add_result("Tenant - Pré-requisito", False, "Token não disponível")
            return False

        headers = {"Authorization": f"Bearer {self.token}"}

        # 1. Teste de listagem de tenants
        success, response = self.test_api_endpoint(
            "GET", 
            "/api/tenants", 
            headers=headers
        )
        
        self.add_result("Tenant - Listagem", success, 
                       "Tenants carregados" if success else f"Falha: {response}")

        # 2. Teste de criação de tenant
        tenant_data = {
            "name": f"Test Tenant {int(time.time())}",
            "plan": "free",
            "owner_email": f"owner_{int(time.time())}@example.com",
            "owner_name": "Test Owner"
        }
        
        success, response = self.test_api_endpoint(
            "POST", 
            "/api/tenants", 
            headers=headers,
            data=tenant_data,
            expected_status=201
        )
        
        tenant_created = success
        new_tenant = response.json() if success else None
        
        self.add_result("Tenant - Criação", success, 
                       "Tenant criado" if success else f"Falha: {response}")

        # 3. Teste de busca de tenant específico
        if tenant_created and new_tenant:
            tenant_id = new_tenant.get("id")
            if tenant_id:
                success, response = self.test_api_endpoint(
                    "GET", 
                    f"/tenants/{tenant_id}", 
                    headers=headers
                )
                
                self.add_result("Tenant - Busca específica", success, 
                               "Tenant encontrado" if success else f"Falha: {response}")

        return True

    def test_load_balancer_functions(self):
        """Testa funções do load balancer"""
        self.log("=== TESTANDO FUNÇÕES DE LOAD BALANCER ===")
        
        if not self.token:
            self.add_result("LoadBalancer - Pré-requisito", False, "Token não disponível")
            return False

        headers = {"Authorization": f"Bearer {self.token}"}

        # 1. Teste de status/health check
        try:
            health_url = f"{BASE_URL}:{NGINX_PORT}/health"
            response = self.session.get(health_url, headers=headers, timeout=10)
            if response.status_code != 200:
                # Fallback para direto
                health_url = f"{DIRECT_API_URL}/health"
                response = self.session.get(health_url, headers=headers, timeout=10)
            success = response.status_code == 200
        except Exception as e:
            success = False
            response = str(e)
        
        self.add_result("LoadBalancer - Health Check", success, 
                       "Sistema saudável" if success else f"Falha: {response}")

        # 2. Teste de status
        success, response = self.test_api_endpoint_basic_auth(
            "GET", 
            "/status"
        )
        
        self.add_result("LoadBalancer - Status", success, 
                       "Status disponível" if success else f"Falha: {response}")

        return True

    def test_dashboard_functions(self):
        """Testa funções específicas do dashboard"""
        self.log("=== TESTANDO FUNÇÕES DO DASHBOARD ===")
        
        if not self.token:
            self.add_result("Dashboard - Pré-requisito", False, "Token não disponível")
            return False

        headers = {"Authorization": f"Bearer {self.token}"}

        # Dashboard usa principalmente as APIs de tenant e billing que já testamos
        # Vamos testar uma rota básica de cluster info
        success, response = self.test_api_endpoint_basic_auth(
            "GET", 
            "/cluster"
        )
        
        self.add_result("Dashboard - Info do cluster", success, 
                       "Info carregada" if success else f"Falha: {response}")

        return True

    def test_error_handling(self):
        """Testa tratamento de erros"""
        self.log("=== TESTANDO TRATAMENTO DE ERROS ===")

        # 1. Teste com token inválido
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        success, response = self.test_api_endpoint(
            "GET", 
            "/profile", 
            headers=invalid_headers,
            expected_status=401
        )
        
        self.add_result("Error Handling - Token inválido", success, 
                       "Erro 401 retornado corretamente" if success else f"Resposta inesperada: {response}")

        # 2. Teste de endpoint inexistente
        success, response = self.test_api_endpoint(
            "GET", 
            "/nonexistent", 
            expected_status=404
        )
        
        self.add_result("Error Handling - Endpoint inexistente", success, 
                       "Erro 404 retornado corretamente" if success else f"Resposta inesperada: {response}")

        # 3. Teste com dados inválidos
        invalid_data = {"invalid": "data"}
        success, response = self.test_api_endpoint(
            "POST", 
            "/auth/login", 
            data=invalid_data,
            expected_status=400
        )
        
        self.add_result("Error Handling - Dados inválidos", success, 
                       "Erro 400 retornado corretamente" if success else f"Resposta inesperada: {response}")

        return True

    def check_api_consistency(self):
        """Verifica consistência das APIs"""
        self.log("=== VERIFICANDO CONSISTÊNCIA DAS APIS ===")
        
        # Verifica se não há /api/api duplicado
        test_endpoints = [
            "/auth/profile",
            "/billing/subscriptions", 
            "/billing/plans",
            "/tenants",
        ]
        
        for endpoint in test_endpoints:
            # Testa URL via nginx (como frontend faz)
            try:
                nginx_url = f"{NGINX_BASE_URL}/api{endpoint}"
                nginx_response = requests.get(nginx_url, timeout=5)
                
                # URL correta deve responder (mesmo que seja 401/403/404 por auth)
                nginx_accessible = nginx_response.status_code != 500
                
                # Testa se direct API funciona também
                direct_url = f"{DIRECT_API_URL}/api{endpoint}"
                direct_response = requests.get(direct_url, timeout=5)
                direct_accessible = direct_response.status_code != 500
                
                consistent = nginx_accessible or direct_accessible
                
                self.add_result(f"Consistência API - {endpoint}", consistent,
                               f"Nginx: {nginx_response.status_code}, Direto: {direct_response.status_code}")
                
            except Exception as e:
                self.add_result(f"Consistência API - {endpoint}", False, f"Erro: {e}")

        # Testa também endpoints root
        try:
            health_nginx = requests.get(f"{BASE_URL}:{NGINX_PORT}/health", timeout=5)
            health_direct = requests.get(f"{DIRECT_API_URL}/health", timeout=5)
            
            health_working = health_nginx.status_code == 200 or health_direct.status_code == 200
            
            self.add_result("Health endpoint", health_working,
                           f"Nginx: {health_nginx.status_code}, Direto: {health_direct.status_code}")
                           
        except Exception as e:
            self.add_result("Health endpoint", False, f"Erro: {e}")

    def run_all_tests(self):
        """Executa todos os testes"""
        self.log("🚀 INICIANDO TESTE ABRANGENTE DO FRONTEND")
        self.log("=" * 60)
        
        start_time = time.time()
        
        # Verifica se os serviços estão rodando
        try:
            # Tenta primeiro via nginx (como frontend faz)
            health_response = requests.get(f"{BASE_URL}:{NGINX_PORT}/health", timeout=5)
            if health_response.status_code != 200:
                # Fallback para API direta
                health_response = requests.get(f"{DIRECT_API_URL}/health", timeout=5)
                if health_response.status_code != 200:
                    self.log("❌ Backend não está respondendo corretamente", "ERROR")
                    return False
        except Exception as e:
            self.log(f"❌ Não foi possível conectar ao backend: {e}", "ERROR")
            return False

        # Executa todos os testes
        tests_executed = [
            self.check_api_consistency(),
            self.test_auth_flow(),
            self.test_billing_functions(),
            self.test_tenant_functions(),
            self.test_load_balancer_functions(),
            self.test_dashboard_functions(),
            self.test_error_handling()
        ]

        # Gera relatório final
        end_time = time.time()
        duration = end_time - start_time
        
        self.generate_report(duration)
        
        return True

    def generate_report(self, duration):
        """Gera relatório final dos testes"""
        self.log("=" * 60)
        self.log("📊 RELATÓRIO FINAL DOS TESTES")
        self.log("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"""
📈 ESTATÍSTICAS GERAIS:
   • Total de testes: {total_tests}
   • Testes aprovados: {passed_tests} (✅)
   • Testes falharam: {failed_tests} (❌)
   • Taxa de sucesso: {success_rate:.1f}%
   • Duração total: {duration:.2f}s

🔍 RESUMO POR CATEGORIA:
""")
        
        # Agrupa por categoria
        categories = {}
        for result in self.test_results:
            category = result["test"].split(" - ")[0]
            if category not in categories:
                categories[category] = {"total": 0, "passed": 0}
            categories[category]["total"] += 1
            if result["success"]:
                categories[category]["passed"] += 1
        
        for category, stats in categories.items():
            rate = (stats["passed"] / stats["total"]) * 100
            status = "✅" if rate == 100 else "⚠️" if rate >= 80 else "❌"
            print(f"   {status} {category}: {stats['passed']}/{stats['total']} ({rate:.1f}%)")
        
        # Lista falhas
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print(f"\n❌ TESTES QUE FALHARAM:")
            for result in failed_results:
                print(f"   • {result['test']}: {result['message']}")
        
        # Salva relatório detalhado
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "duration": duration,
            "statistics": {
                "total": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": success_rate
            },
            "categories": categories,
            "detailed_results": self.test_results
        }
        
        with open("/workspaces/VeloFlux/frontend_test_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n📄 Relatório detalhado salvo em: frontend_test_report.json")
        
        if success_rate >= 90:
            print(f"\n🎉 EXCELENTE! Sistema funcionando muito bem!")
        elif success_rate >= 80:
            print(f"\n👍 BOM! Algumas melhorias podem ser feitas.")
        else:
            print(f"\n⚠️  ATENÇÃO! Sistema precisa de correções importantes.")

def main():
    """Função principal"""
    tester = FrontendTester()
    
    try:
        success = tester.run_all_tests()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Erro inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
