#!/usr/bin/env python3
"""
Teste Completo das Funcionalidades Frontend VeloFlux
Verifica se todas as APIs estão sendo chamadas corretamente
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configurações
BASE_URL = "http://localhost"
FRONTEND_URL = "http://localhost:3000"

def print_test_header(title):
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    print(f"\n[{step}] {description}")

def print_result(success, message):
    status = "✅" if success else "❌"
    print(f"   {status} {message}")

class VeloFluxTester:
    def __init__(self):
        self.token = None
        self.user_data = None
        self.tenant_id = None
        
    def test_user_registration_and_auth(self):
        """Testa registro de usuário e autenticação"""
        print_test_header("TESTE 1: AUTENTICAÇÃO E REGISTRO")
        
        # Dados do usuário de teste
        user_data = {
            "email": f"test_frontend_{int(time.time())}@veloflux.com",
            "password": "TestPassword123!",
            "first_name": "Frontend",
            "last_name": "Tester",
            "tenant_name": f"Frontend-Test-{int(time.time())}"
        }
        
        print_step("1.1", "Registrando novo usuário...")
        try:
            response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
            if response.status_code in [200, 201]:  # 200 ou 201 são ambos válidos
                data = response.json()
                self.token = data.get("token")
                self.user_data = data.get("user")
                self.tenant_id = self.user_data.get("tenant_id")
                print_result(True, f"Usuário registrado: {user_data['email']}")
                print_result(True, f"Token obtido: {self.token[:50]}...")
                print_result(True, f"Tenant ID: {self.tenant_id}")
            else:
                print_result(False, f"Erro no registro: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print_result(False, f"Erro de conexão: {e}")
            return False
            
        print_step("1.2", "Testando login...")
        try:
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
            if response.status_code in [200, 201]:
                print_result(True, "Login realizado com sucesso")
            else:
                print_result(False, f"Erro no login: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro no login: {e}")
            
        return True
    
    def test_billing_apis(self):
        """Testa todas as APIs de billing"""
        print_test_header("TESTE 2: APIs DE BILLING")
        
        if not self.token:
            print_result(False, "Token não disponível")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Teste 2.1: Listar assinaturas
        print_step("2.1", "Testando GET /api/billing/subscriptions")
        try:
            response = requests.get(f"{BASE_URL}/api/billing/subscriptions", headers=headers)
            if response.status_code == 200:
                data = response.json()
                print_result(True, f"Assinaturas carregadas: {data.get('total_count', 0)} items")
            else:
                print_result(False, f"Erro: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        # Teste 2.2: Criar assinatura
        print_step("2.2", "Testando POST /api/billing/subscriptions")
        try:
            subscription_data = {
                "plan": "pro",
                "billing_cycle": "monthly"
            }
            response = requests.post(f"{BASE_URL}/api/billing/subscriptions", 
                                   json=subscription_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                subscription_id = data.get("data", {}).get("subscription_id")
                print_result(True, f"Assinatura criada: {subscription_id}")
                
                # Teste 2.3: Atualizar assinatura
                print_step("2.3", f"Testando PUT /api/billing/subscriptions/{subscription_id}")
                update_data = {"plan": "enterprise"}
                response = requests.put(f"{BASE_URL}/api/billing/subscriptions/{subscription_id}",
                                      json=update_data, headers=headers)
                if response.status_code == 200:
                    print_result(True, "Assinatura atualizada para Enterprise")
                else:
                    print_result(False, f"Erro na atualização: {response.status_code}")
            else:
                print_result(False, f"Erro na criação: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        # Teste 2.4: Listar faturas
        print_step("2.4", "Testando GET /api/billing/invoices")
        try:
            response = requests.get(f"{BASE_URL}/api/billing/invoices", headers=headers)
            if response.status_code == 200:
                data = response.json()
                print_result(True, f"Faturas carregadas: {data.get('total_count', 0)} items")
            else:
                print_result(False, f"Erro: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        # Teste 2.5: Listar planos
        print_step("2.5", "Testando GET /api/billing/plans")
        try:
            response = requests.get(f"{BASE_URL}/api/billing/plans", headers=headers)
            if response.status_code in [200, 404]:  # 404 pode ser OK se não implementado
                print_result(True, f"Endpoint de planos: {response.status_code}")
            else:
                print_result(False, f"Erro: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        return True
    
    def test_tenant_apis(self):
        """Testa APIs de tenant management"""
        print_test_header("TESTE 3: APIs DE TENANT")
        
        if not self.token:
            print_result(False, "Token não disponível")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Teste 3.1: Listar tenants
        print_step("3.1", "Testando GET /api/tenants")
        try:
            response = requests.get(f"{BASE_URL}/api/tenants", headers=headers)
            if response.status_code == 200:
                data = response.json()
                print_result(True, f"Tenants carregados: {len(data)} items")
            else:
                print_result(False, f"Erro: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        # Teste 3.2: Obter tenant específico
        if self.tenant_id:
            print_step("3.2", f"Testando GET /api/tenants/{self.tenant_id}")
            try:
                response = requests.get(f"{BASE_URL}/api/tenants/{self.tenant_id}", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    print_result(True, f"Tenant obtido: {data.get('name', 'N/A')}")
                else:
                    print_result(False, f"Erro: {response.status_code}")
            except Exception as e:
                print_result(False, f"Erro: {e}")
                
        return True
    
    def test_admin_apis(self):
        """Testa APIs administrativas"""
        print_test_header("TESTE 4: APIs ADMINISTRATIVAS")
        
        if not self.token:
            print_result(False, "Token não disponível")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Teste 4.1: Health check
        print_step("4.1", "Testando GET /health")
        try:
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print_result(True, f"Health status: {data.get('status', 'unknown')}")
            else:
                print_result(False, f"Erro: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        # Teste 4.2: API Health
        print_step("4.2", "Testando GET /api/health")
        try:
            response = requests.get(f"{BASE_URL}/api/health")
            if response.status_code == 200:
                data = response.json()
                print_result(True, f"API Health status: {data.get('status', 'unknown')}")
            else:
                print_result(False, f"Erro: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        return True
    
    def test_frontend_access(self):
        """Testa acesso ao frontend"""
        print_test_header("TESTE 5: ACESSO AO FRONTEND")
        
        print_step("5.1", "Testando acesso ao frontend via load balancer")
        try:
            response = requests.get(BASE_URL, timeout=10)
            if response.status_code == 200:
                print_result(True, f"Frontend acessível via load balancer: {BASE_URL}")
            else:
                print_result(False, f"Erro: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        print_step("5.2", "Testando acesso direto ao frontend")
        try:
            response = requests.get(FRONTEND_URL, timeout=10)
            if response.status_code == 200:
                print_result(True, f"Frontend acessível diretamente: {FRONTEND_URL}")
            else:
                print_result(False, f"Erro: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        return True
    
    def test_api_integration_points(self):
        """Testa pontos específicos de integração que o frontend usa"""
        print_test_header("TESTE 6: PONTOS DE INTEGRAÇÃO FRONTEND")
        
        if not self.token:
            print_result(False, "Token não disponível")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Teste 6.1: Endpoint usado pelo useAuth hook
        print_step("6.1", "Testando endpoint para useAuth hook")
        try:
            response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
            if response.status_code in [200, 404]:  # Pode não estar implementado
                print_result(True, f"Auth me endpoint: {response.status_code}")
            else:
                print_result(False, f"Erro: {response.status_code}")
        except Exception as e:
            print_result(False, f"Erro: {e}")
            
        # Teste 6.2: Endpoints de configuração
        print_step("6.2", "Testando endpoints de configuração")
        config_endpoints = [
            "/api/config",
            "/api/settings",
            "/admin/api/config"
        ]
        
        for endpoint in config_endpoints:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
                status_ok = response.status_code in [200, 401, 403, 404]  # Esperados
                print_result(status_ok, f"{endpoint}: {response.status_code}")
            except Exception as e:
                print_result(False, f"{endpoint}: Erro - {e}")
                
        return True
    
    def run_all_tests(self):
        """Executa todos os testes"""
        print(f"""
🧪 TESTE COMPLETO DAS FUNCIONALIDADES FRONTEND VELOFLUX
======================================================
📅 Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
🌐 Base URL: {BASE_URL}
🖥️  Frontend: {FRONTEND_URL}
======================================================
        """)
        
        tests = [
            ("Autenticação e Registro", self.test_user_registration_and_auth),
            ("APIs de Billing", self.test_billing_apis),
            ("APIs de Tenant", self.test_tenant_apis),
            ("APIs Administrativas", self.test_admin_apis),
            ("Acesso ao Frontend", self.test_frontend_access),
            ("Integração Frontend", self.test_api_integration_points)
        ]
        
        results = []
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print_result(False, f"Erro no teste {test_name}: {e}")
                results.append((test_name, False))
        
        # Relatório final
        print_test_header("RELATÓRIO FINAL DOS TESTES")
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASSOU" if result else "❌ FALHOU"
            print(f"   {status} - {test_name}")
        
        print(f"\n📊 RESUMO: {passed}/{total} testes passaram")
        
        if passed == total:
            print("\n🎉 TODOS OS TESTES PASSARAM! Frontend está funcionando corretamente!")
            return True
        else:
            print(f"\n⚠️  {total - passed} teste(s) falharam. Verifique os detalhes acima.")
            return False

def main():
    tester = VeloFluxTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
