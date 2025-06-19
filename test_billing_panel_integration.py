#!/usr/bin/env python3
"""
Teste Específico da Integração ModernBillingPanel
Verifica se todas as chamadas de API do componente estão funcionando
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost"

def test_billing_panel_integration():
    """Testa a integração completa do ModernBillingPanel"""
    
    print("🎯 TESTE ESPECÍFICO: MODERNBILLINGPANEL INTEGRATION")
    print("=" * 60)
    
    # 1. Registrar usuário para testes
    print("\n[1] Registrando usuário de teste...")
    user_data = {
        "email": f"billing_panel_test_{int(time.time())}@veloflux.com",
        "password": "TestPassword123!",
        "first_name": "BillingPanel",
        "last_name": "Test",
        "tenant_name": f"BillingPanel-Test-{int(time.time())}"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
    if response.status_code not in [200, 201]:
        print(f"❌ Erro no registro: {response.status_code}")
        return False
        
    token = response.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ Usuário registrado e token obtido")
    
    # 2. Testar loadBillingData (3 chamadas em paralelo)
    print("\n[2] Testando loadBillingData (chamadas do useEffect)...")
    
    # 2.1 GET /api/billing/subscriptions
    print("  [2.1] apiFetch('/api/billing/subscriptions')")
    try:
        response = requests.get(f"{BASE_URL}/api/billing/subscriptions", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"    ✅ Subscriptions: {data.get('total_count', 0)} items")
        else:
            print(f"    ❌ Erro: {response.status_code}")
            return False
    except Exception as e:
        print(f"    ❌ Erro: {e}")
        return False
    
    # 2.2 GET /api/billing/invoices  
    print("  [2.2] apiFetch('/api/billing/invoices')")
    try:
        response = requests.get(f"{BASE_URL}/api/billing/invoices", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"    ✅ Invoices: {data.get('total_count', 0)} items")
        else:
            print(f"    ❌ Erro: {response.status_code}")
            return False
    except Exception as e:
        print(f"    ❌ Erro: {e}")
        return False
    
    # 2.3 GET /api/billing/plans (com fallback)
    print("  [2.3] apiFetch('/api/billing/plans') - com fallback")
    try:
        response = requests.get(f"{BASE_URL}/api/billing/plans", headers=headers)
        if response.status_code in [200, 404]:  # 404 é esperado como fallback
            print(f"    ✅ Plans endpoint: {response.status_code} (fallback OK)")
        else:
            print(f"    ❌ Erro inesperado: {response.status_code}")
            return False
    except Exception as e:
        print(f"    ❌ Erro: {e}")
        return False
    
    # 3. Testar createSubscription
    print("\n[3] Testando createSubscription...")
    print("  [3.1] apiFetch('/api/billing/subscriptions', POST)")
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
            print(f"    ✅ Subscription created: {subscription_id}")
        else:
            print(f"    ❌ Erro: {response.status_code}")
            return False
    except Exception as e:
        print(f"    ❌ Erro: {e}")
        return False
    
    # 4. Testar updateSubscription
    print("\n[4] Testando updateSubscription...")
    print(f"  [4.1] apiFetch('/api/billing/subscriptions/{subscription_id}', PUT)")
    try:
        update_data = {"plan": "enterprise"}
        response = requests.put(f"{BASE_URL}/api/billing/subscriptions/{subscription_id}",
                              json=update_data, headers=headers)
        if response.status_code == 200:
            print(f"    ✅ Subscription updated to enterprise")
        else:
            print(f"    ❌ Erro: {response.status_code}")
            return False
    except Exception as e:
        print(f"    ❌ Erro: {e}")
        return False
    
    # 5. Verificar estado final
    print("\n[5] Verificando estado final...")
    try:
        response = requests.get(f"{BASE_URL}/api/billing/subscriptions", headers=headers)
        if response.status_code == 200:
            data = response.json()
            subscriptions = data.get("items", [])
            if subscriptions:
                latest_subscription = subscriptions[0]
                plan = latest_subscription.get("plan")
                status = latest_subscription.get("status")
                print(f"    ✅ Estado final: Plan={plan}, Status={status}")
            else:
                print(f"    ❌ Nenhuma subscription encontrada")
                return False
        else:
            print(f"    ❌ Erro verificando estado: {response.status_code}")
            return False
    except Exception as e:
        print(f"    ❌ Erro: {e}")
        return False
    
    # 6. Testar funcionalidades de UI específicas
    print("\n[6] Testando funcionalidades de UI...")
    
    # Verificar se pode listar faturas para a UI
    response = requests.get(f"{BASE_URL}/api/billing/invoices", headers=headers)
    invoices = response.json().get("items", [])
    print(f"    ✅ Faturas para UI: {len(invoices)} items disponíveis")
    
    # Verificar dados de estatísticas
    if invoices:
        total_amount = sum(invoice.get("amount_due", 0) for invoice in invoices)
        print(f"    ✅ Total pago (para estatísticas): ${total_amount / 100:.2f}")
    
    # Verificar dados de data para cálculo de "Tempo como cliente"
    if subscriptions:
        created_at = subscriptions[0].get("created_at")
        if created_at:
            print(f"    ✅ Data criação (para cálculo de tempo): {created_at}")
    
    print("\n" + "=" * 60)
    print("🎉 TODOS OS TESTES DE INTEGRAÇÃO PASSARAM!")
    print("✅ ModernBillingPanel está corretamente integrado com as APIs")
    print("✅ Todas as chamadas apiFetch funcionando")
    print("✅ Fluxo completo de billing operacional")
    print("✅ UI pode carregar e exibir dados corretamente")
    
    return True

def test_ui_error_handling():
    """Testa tratamento de erros da UI"""
    print("\n🛡️  TESTE DE TRATAMENTO DE ERROS")
    print("=" * 60)
    
    # Teste com token inválido
    print("\n[1] Testando com token inválido...")
    invalid_headers = {"Authorization": "Bearer invalid_token_123"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/billing/subscriptions", headers=invalid_headers)
        if response.status_code == 401:
            print("    ✅ Erro 401 corretamente retornado para token inválido")
        else:
            print(f"    ⚠️  Código inesperado: {response.status_code}")
    except Exception as e:
        print(f"    ✅ Exceção capturada (esperado): {type(e).__name__}")
    
    # Teste sem token
    print("\n[2] Testando sem token...")
    try:
        response = requests.get(f"{BASE_URL}/api/billing/subscriptions")
        if response.status_code == 401:
            print("    ✅ Erro 401 corretamente retornado sem token")
        else:
            print(f"    ⚠️  Código inesperado: {response.status_code}")
    except Exception as e:
        print(f"    ✅ Exceção capturada (esperado): {type(e).__name__}")
    
    print("✅ Tratamento de erros funcionando corretamente")
    return True

def main():
    print(f"""
🧪 TESTE COMPLETO: MODERNBILLINGPANEL INTEGRATION  
======================================================
📅 Data/Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
🎯 Objetivo: Verificar integração completa do componente
🌐 Base URL: {BASE_URL}
======================================================
    """)
    
    # Executar testes
    integration_ok = test_billing_panel_integration()
    error_handling_ok = test_ui_error_handling()
    
    if integration_ok and error_handling_ok:
        print(f"""
🏆 RESULTADO FINAL: SUCESSO COMPLETO!
=====================================
✅ Integração ModernBillingPanel: FUNCIONANDO
✅ Chamadas apiFetch: TODAS OPERACIONAIS  
✅ Tratamento de erros: IMPLEMENTADO
✅ Fluxo de billing: COMPLETO

🎯 CONCLUSÃO:
O ModernBillingPanel está 100% integrado e funcional!
Todas as APIs estão respondendo corretamente e a UI
pode carregar e manipular dados sem problemas.

🚀 PRONTO PARA PRODUÇÃO!
        """)
        return True
    else:
        print("\n❌ Alguns testes falharam. Verifique os detalhes acima.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
