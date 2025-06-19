#!/usr/bin/env python3
"""
🔥 Teste Completo de Billing - VeloFlux
Simula um usuário real testando todo o fluxo de billing com Stripe
"""
import requests
import json
import time
from datetime import datetime

class VeloFluxBillingTester:
    def __init__(self):
        self.base_url = "http://localhost"
        self.session = requests.Session()
        self.jwt_token = None
        self.user_info = None
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")
        
    def register_user(self):
        """Passo 1: Registrar um novo usuário"""
        self.log("🔥 INICIANDO TESTE COMPLETO DE BILLING")
        self.log("📝 Registrando novo usuário...")
        
        user_data = {
            "email": f"billing_test_{int(time.time())}@veloflux.com",
            "password": "VeloFlux2025!",
            "first_name": "Billing",
            "last_name": "Tester",
            "tenant_name": "VeloFlux Billing Test Company",
            "plan": "free"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=user_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                self.jwt_token = data.get('token')
                self.user_info = data.get('user', {})
                self.session.headers.update({
                    'Authorization': f'Bearer {self.jwt_token}'
                })
                self.log(f"✅ Usuário registrado: {user_data['email']}")
                self.log(f"🔑 Token JWT obtido: {self.jwt_token[:50]}...")
                return True
            else:
                self.log(f"❌ Falha no registro: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Erro no registro: {str(e)}", "ERROR")
            return False
    
    def test_billing_plans(self):
        """Passo 2: Listar planos disponíveis"""
        self.log("📋 Testando lista de planos de billing...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/billing/plans")
            
            if response.status_code == 200:
                plans = response.json()
                self.log(f"✅ Planos disponíveis encontrados: {len(plans)} planos")
                for plan in plans:
                    self.log(f"   📦 {plan.get('display_name', 'N/A')} - ${plan.get('price_monthly', 0)/100:.2f}/mês")
                return plans
            else:
                self.log(f"❌ Falha ao obter planos: {response.status_code} - {response.text}", "ERROR")
                return []
                
        except Exception as e:
            self.log(f"❌ Erro ao obter planos: {str(e)}", "ERROR")
            return []
    
    def create_subscription(self, plan_type="pro"):
        """Passo 3: Criar uma assinatura"""
        self.log(f"💳 Criando assinatura para plano: {plan_type}")
        
        subscription_data = {
            "plan_type": plan_type,
            "billing_cycle": "monthly"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/billing/subscriptions",
                json=subscription_data
            )
            
            if response.status_code in [200, 201]:
                subscription = response.json()
                self.log(f"✅ Assinatura criada: {subscription.get('id', 'N/A')}")
                self.log(f"   Status: {subscription.get('status', 'N/A')}")
                return subscription
            else:
                self.log(f"❌ Falha ao criar assinatura: {response.status_code} - {response.text}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Erro ao criar assinatura: {str(e)}", "ERROR")
            return None
    
    def list_subscriptions(self):
        """Passo 4: Listar assinaturas do usuário"""
        self.log("📜 Listando assinaturas do usuário...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/billing/subscriptions")
            
            if response.status_code == 200:
                subscriptions = response.json()
                self.log(f"✅ Assinaturas encontradas: {len(subscriptions)}")
                for sub in subscriptions:
                    self.log(f"   🔖 ID: {sub.get('id', 'N/A')} - Status: {sub.get('status', 'N/A')}")
                return subscriptions
            else:
                self.log(f"❌ Falha ao listar assinaturas: {response.status_code} - {response.text}", "ERROR")
                return []
                
        except Exception as e:
            self.log(f"❌ Erro ao listar assinaturas: {str(e)}", "ERROR")
            return []
    
    def update_subscription(self, subscription_id, new_plan="enterprise"):
        """Passo 5: Atualizar assinatura (upgrade)"""
        self.log(f"⬆️ Fazendo upgrade da assinatura {subscription_id} para {new_plan}")
        
        update_data = {
            "plan_type": new_plan
        }
        
        try:
            response = self.session.put(
                f"{self.base_url}/api/billing/subscriptions/{subscription_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                subscription = response.json()
                self.log(f"✅ Assinatura atualizada com sucesso")
                self.log(f"   Novo plano: {subscription.get('plan_type', 'N/A')}")
                return subscription
            else:
                self.log(f"❌ Falha ao atualizar assinatura: {response.status_code} - {response.text}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Erro ao atualizar assinatura: {str(e)}", "ERROR")
            return None
    
    def downgrade_subscription(self, subscription_id, new_plan="pro"):
        """Passo 6: Fazer downgrade da assinatura"""
        self.log(f"⬇️ Fazendo downgrade da assinatura {subscription_id} para {new_plan}")
        
        update_data = {
            "plan_type": new_plan
        }
        
        try:
            response = self.session.put(
                f"{self.base_url}/api/billing/subscriptions/{subscription_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                subscription = response.json()
                self.log(f"✅ Downgrade realizado com sucesso")
                self.log(f"   Novo plano: {subscription.get('plan_type', 'N/A')}")
                return subscription
            else:
                self.log(f"❌ Falha no downgrade: {response.status_code} - {response.text}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Erro no downgrade: {str(e)}", "ERROR")
            return None
    
    def list_invoices(self):
        """Passo 7: Listar faturas"""
        self.log("🧾 Listando faturas do usuário...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/billing/invoices")
            
            if response.status_code == 200:
                invoices = response.json()
                self.log(f"✅ Faturas encontradas: {len(invoices)}")
                for invoice in invoices:
                    self.log(f"   💰 ID: {invoice.get('id', 'N/A')} - Valor: ${invoice.get('amount', 0)/100:.2f}")
                return invoices
            else:
                self.log(f"❌ Falha ao listar faturas: {response.status_code} - {response.text}", "ERROR")
                return []
                
        except Exception as e:
            self.log(f"❌ Erro ao listar faturas: {str(e)}", "ERROR")
            return []
    
    def test_webhook(self):
        """Passo 8: Testar webhook do Stripe"""
        self.log("🔗 Testando webhook do Stripe...")
        
        # Simular um webhook do Stripe
        webhook_data = {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_test123",
                    "status": "active",
                    "plan": {"id": "price_1RbVEkBLQoA2ESIG1lQWhURH"}
                }
            }
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/billing/webhooks",
                json=webhook_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code in [200, 204]:
                self.log("✅ Webhook processado com sucesso")
                return True
            else:
                self.log(f"❌ Falha no webhook: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Erro no webhook: {str(e)}", "ERROR")
            return False
    
    def run_complete_test(self):
        """Executa o teste completo de billing"""
        self.log("🚀 INICIANDO TESTE COMPLETO DE BILLING COM STRIPE")
        self.log("=" * 60)
        
        # Passo 1: Registrar usuário
        if not self.register_user():
            return False
        
        time.sleep(1)
        
        # Passo 2: Testar planos
        plans = self.test_billing_plans()
        if not plans:
            self.log("⚠️ Continuando sem planos...")
        
        time.sleep(1)
        
        # Passo 3: Criar assinatura
        subscription = self.create_subscription("pro")
        if not subscription:
            self.log("⚠️ Falha ao criar assinatura, mas continuando teste...")
        
        time.sleep(1)
        
        # Passo 4: Listar assinaturas
        subscriptions = self.list_subscriptions()
        
        # Se conseguimos criar uma assinatura, vamos testá-la
        if subscription and subscription.get('id'):
            subscription_id = subscription['id']
            
            time.sleep(1)
            
            # Passo 5: Upgrade
            self.update_subscription(subscription_id, "enterprise")
            
            time.sleep(1)
            
            # Passo 6: Downgrade  
            self.downgrade_subscription(subscription_id, "pro")
        
        time.sleep(1)
        
        # Passo 7: Listar faturas
        self.list_invoices()
        
        time.sleep(1)
        
        # Passo 8: Testar webhook
        self.test_webhook()
        
        self.log("=" * 60)
        self.log("🎉 TESTE COMPLETO DE BILLING FINALIZADO!")
        
        return True

if __name__ == "__main__":
    tester = VeloFluxBillingTester()
    tester.run_complete_test()
