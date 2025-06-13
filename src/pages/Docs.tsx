import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Book, 
  Users, 
  Code, 
  Server, 
  Shield, 
  Gauge, 
  Settings, 
  Globe, 
  Download,
  Terminal,
  Play,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  FileText,
  Database,
  Cloud,
  Zap,
  Wifi 
} from 'lucide-react';
import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';

const Docs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">VeloFlux LB - Documentação Completa</h1>
          <p className="text-xl text-blue-200 mb-6">
            Guia abrangente para usuários iniciantes e avançados do VeloFlux Load Balancer
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Badge className="bg-green-100/10 text-green-300 px-3 py-1">
              <Book className="w-4 h-4 mr-2" />
              Guia Completo
            </Badge>
            <Badge className="bg-blue-100/10 text-blue-300 px-3 py-1">
              <Users className="w-4 h-4 mr-2" />
              Para Todos os Níveis
            </Badge>
            <Badge className="bg-purple-100/10 text-purple-300 px-3 py-1">
              <Code className="w-4 h-4 mr-2" />
              Frontend + Backend
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="intro" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 w-full">
            <TabsTrigger value="intro" className="text-xs">Introdução</TabsTrigger>
            <TabsTrigger value="beginner" className="text-xs">Iniciantes</TabsTrigger>
            <TabsTrigger value="installation" className="text-xs">Instalação</TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="configuration" className="text-xs">Configuração</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">Avançado</TabsTrigger>
            <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
            <TabsTrigger value="troubleshooting" className="text-xs">Solução</TabsTrigger>
          </TabsList>

          {/* Introdução */}
          <TabsContent value="intro" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Globe className="w-8 h-8 mr-3 text-blue-400" />
                O que é o VeloFlux LB?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Para Usuários Leigos</h3>
                  <p className="text-blue-100 mb-4">
                    O VeloFlux LB é como um "diretor de tráfego" para seu site ou aplicação web. 
                    Imagine que você tem uma loja online que recebe muitos visitantes. Em vez de 
                    todos tentarem entrar pela mesma porta (que poderia quebrar), o VeloFlux 
                    distribui os visitantes entre várias "portas" (servidores) de forma inteligente.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                      <div>
                        <strong className="text-white">Distribuição de Carga:</strong>
                        <p className="text-blue-200 text-sm">Divide o tráfego entre vários servidores</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                      <div>
                        <strong className="text-white">Alta Disponibilidade:</strong>
                        <p className="text-blue-200 text-sm">Se um servidor falha, outros continuam funcionando</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                      <div>
                        <strong className="text-white">HTTPS Automático:</strong>
                        <p className="text-blue-200 text-sm">Certificados SSL gratuitos e automáticos</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Para Desenvolvedores</h3>
                  <p className="text-blue-100 mb-4">
                    VeloFlux LB é um load balancer container-native escrito em Go, projetado para 
                    ambientes cloud-native com suporte a HTTP/3, terminação SSL automática, 
                    health checks ativos/passivos e roteamento geo-aware.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Server className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                        <strong className="text-white">Algoritmos de Balanceamento:</strong>
                        <p className="text-blue-200 text-sm">Round-robin, least-connections, IP-hash, weighted</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                        <strong className="text-white">Segurança Integrada:</strong>
                        <p className="text-blue-200 text-sm">WAF (Coraza), Rate Limiting, TLS termination</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Gauge className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                        <strong className="text-white">Observabilidade:</strong>
                        <p className="text-blue-200 text-sm">Métricas Prometheus, logs estruturados JSON</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <h3 className="text-2xl font-bold text-white mb-4">Arquitetura do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-600/20 rounded-lg">
                  <Globe className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-white mb-2">Frontend</h4>
                  <p className="text-blue-200 text-sm">Dashboard React para gerenciamento visual</p>
                </div>
                
                <div className="text-center p-4 bg-green-600/20 rounded-lg">
                  <Server className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-white mb-2">Load Balancer</h4>
                  <p className="text-blue-200 text-sm">Core em Go com alta performance</p>
                </div>
                
                <div className="text-center p-4 bg-purple-600/20 rounded-lg">
                  <Database className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-white mb-2">Redis Cluster</h4>
                  <p className="text-blue-200 text-sm">Estado compartilhado entre instâncias</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Guia para Iniciantes */}
          <TabsContent value="beginner" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Users className="w-8 h-8 mr-3 text-green-400" />
                Guia para Iniciantes
              </h2>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="what-is-lb" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    1. O que é um Load Balancer e por que preciso dele?
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-200 space-y-4">
                    <p>
                      Um Load Balancer é como um porteiro inteligente para seu site. Quando muitas pessoas 
                      tentam acessar seu site ao mesmo tempo, ele distribui essas visitas entre vários 
                      servidores para que nenhum fique sobrecarregado.
                    </p>
                    
                    <h4 className="text-white font-semibold">Benefícios principais:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Performance:</strong> Site mais rápido mesmo com muitos usuários</li>
                      <li><strong>Confiabilidade:</strong> Se um servidor para, os outros continuam</li>
                      <li><strong>Escalabilidade:</strong> Fácil adicionar mais servidores quando necessário</li>
                      <li><strong>Segurança:</strong> Proteção contra ataques e sobrecarga</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="when-use" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    2. Quando devo usar o VeloFlux LB?
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-200 space-y-4">
                    <h4 className="text-white font-semibold">Use o VeloFlux LB se você tem:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Um site ou aplicação que recebe muitos acessos simultâneos</li>
                      <li>Múltiplos servidores rodando a mesma aplicação</li>
                      <li>Necessidade de alta disponibilidade (99.9% uptime)</li>
                      <li>Precisa de HTTPS automático</li>
                      <li>Quer proteger contra ataques DDoS</li>
                      <li>Aplicações containerizadas (Docker/Kubernetes)</li>
                    </ul>
                    
                    <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400 mt-1" />
                        <div>
                          <h5 className="text-yellow-300 font-semibold">Dica para Iniciantes</h5>
                          <p className="text-yellow-100 text-sm">
                            Mesmo se você tem apenas um servidor hoje, configurar um load balancer 
                            facilita muito a expansão futura!
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="basic-concepts" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    3. Conceitos Básicos que Você Precisa Entender
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-white font-semibold mb-2">Backend/Servidor</h5>
                        <p className="text-sm">Seu servidor real onde sua aplicação roda (ex: servidor web, API)</p>
                      </div>
                      
                      <div>
                        <h5 className="text-white font-semibold mb-2">Pool</h5>
                        <p className="text-sm">Grupo de servidores que fazem a mesma função</p>
                      </div>
                      
                      <div>
                        <h5 className="text-white font-semibold mb-2">Health Check</h5>
                        <p className="text-sm">Verificação automática se seus servidores estão funcionando</p>
                      </div>
                      
                      <div>
                        <h5 className="text-white font-semibold mb-2">SSL/TLS</h5>
                        <p className="text-sm">Certificado que torna seu site HTTPS (cadeado verde)</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="first-steps" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    4. Primeiros Passos - Lista de Verificação
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-200 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                        <div>
                          <strong className="text-white">Tenha seus servidores prontos</strong>
                          <p className="text-sm">Pelo menos 1 servidor com sua aplicação funcionando</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                        <div>
                          <strong className="text-white">Instale o VeloFlux LB</strong>
                          <p className="text-sm">Use Docker (mais fácil) ou compile do código</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                        <div>
                          <strong className="text-white">Configure o básico</strong>
                          <p className="text-sm">Crie um pool com seus servidores</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                        <div>
                          <strong className="text-white">Teste tudo</strong>
                          <p className="text-sm">Acesse seu site através do load balancer</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
                      onClick={() => navigate('/register')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Começar Agora
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </TabsContent>

          {/* Instalação */}
          <TabsContent value="installation" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Download className="w-8 h-8 mr-3 text-blue-400" />
                Instalação e Configuração Inicial
              </h2>

              <Tabs defaultValue="docker" className="space-y-6">
                <TabsList className="bg-white/5 border-white/10">
                  <TabsTrigger value="docker">Docker (Recomendado)</TabsTrigger>
                  <TabsTrigger value="compose">Docker Compose</TabsTrigger>
                  <TabsTrigger value="kubernetes">Kubernetes</TabsTrigger>
                  <TabsTrigger value="source">Código Fonte</TabsTrigger>
                </TabsList>

                <TabsContent value="docker" className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Instalação com Docker</h3>
                  
                  <div className="bg-black/50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">1. Crie um arquivo de configuração:</h4>
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# config.yaml
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  
pools:
  - name: "web-servers"
    algorithm: "round_robin"
    backends:
      - address: "192.168.1.100:8080"
        weight: 100

routes:
  - host: "meusite.com"
    pool: "web-servers"`}
                    </pre>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">2. Execute o container:</h4>
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`docker run -d \\
  --name veloflux-lb \\
  -p 80:80 -p 443:443 \\
  -v $(pwd)/config.yaml:/etc/veloflux/config.yaml \\
  ghcr.io/veloflux/lb:latest`}
                    </pre>
                  </div>

                  <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">✅ Pronto! Seu load balancer está rodando</h4>
                    <ul className="text-blue-100 text-sm space-y-1">
                      <li>• HTTP: http://localhost</li>
                      <li>• Dashboard: http://localhost:9000</li>
                      <li>• Métricas: http://localhost:8080/metrics</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="compose" className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Docker Compose (Stack Completa)</h3>
                  
                  <div className="bg-black/50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">docker-compose.yml:</h4>
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`version: '3.8'
services:
  veloflux-lb:
    image: ghcr.io/veloflux/lb:latest
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
      - "9000:9000"
    volumes:
      - ./config:/etc/veloflux
      - ./certs:/etc/ssl/certs
    environment:
      - VFX_CONFIG=/etc/veloflux/config.yaml
      - VF_ADMIN_USER=admin
      - VF_ADMIN_PASS=senha123
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:`}
                    </pre>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">Executar:</h4>
                    <pre className="text-green-400 text-sm">
{`docker-compose up -d`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="kubernetes" className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Kubernetes com Helm</h3>
                  
                  <div className="bg-black/50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">1. Adicionar repositório Helm:</h4>
                    <pre className="text-green-400 text-sm">
{`helm repo add veloflux https://charts.veloflux.io
helm repo update`}
                    </pre>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">2. Instalar:</h4>
                    <pre className="text-green-400 text-sm">
{`helm install veloflux veloflux/veloflux \\
  --set ingress.enabled=true \\
  --set ingress.hostname=meusite.com`}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="source" className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Compilar do Código Fonte</h3>
                  
                  <div className="bg-black/50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">Pré-requisitos:</h4>
                    <ul className="text-blue-100 text-sm space-y-1">
                      <li>• Go 1.22+</li>
                      <li>• Git</li>
                      <li>• Make (opcional)</li>
                    </ul>
                  </div>

                  <div className="bg-black/50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">Compilação:</h4>
                    <pre className="text-green-400 text-sm">
{`git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
go mod download
go build -o veloflux ./cmd/velofluxlb
./veloflux`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </TabsContent>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-purple-400" />
                Dashboard Web - Interface de Gerenciamento
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Acessando o Dashboard</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-600/20 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">URL de Acesso:</h4>
                      <code className="text-green-400">http://seu-servidor:9000</code>
                    </div>
                    
                    <div className="bg-yellow-600/20 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Credenciais Padrão:</h4>
                      <ul className="text-yellow-100 text-sm space-y-1">
                        <li><strong>Usuário:</strong> admin</li>
                        <li><strong>Senha:</strong> definida na variável VF_ADMIN_PASS</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Funcionalidades Principais</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Server className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                        <strong className="text-white">Overview:</strong>
                        <p className="text-blue-200 text-sm">Status geral dos backends e métricas</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Gauge className="w-5 h-5 text-green-400 mt-1" />
                      <div>
                        <strong className="text-white">Health Monitor:</strong>
                        <p className="text-blue-200 text-sm">Monitoramento em tempo real da saúde dos servidores</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-red-400 mt-1" />
                      <div>
                        <strong className="text-white">Segurança:</strong>
                        <p className="text-blue-200 text-sm">Configuração de WAF e rate limiting</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">Guia das Abas do Dashboard</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white/5 border-white/10 p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <Server className="w-5 h-5 mr-2 text-blue-400" />
                      Overview
                    </h4>
                    <p className="text-blue-200 text-sm mb-3">
                      Visão geral do sistema com estatísticas principais
                    </p>
                    <ul className="text-xs text-blue-100 space-y-1">
                      <li>• Total de backends ativos</li>
                      <li>• Requisições por segundo</li>
                      <li>• Latência média</li>
                      <li>• Status dos pools</li>
                    </ul>
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <Gauge className="w-5 h-5 mr-2 text-green-400" />
                      Health Monitor
                    </h4>
                    <p className="text-blue-200 text-sm mb-3">
                      Monitoramento detalhado da saúde dos servidores
                    </p>
                    <ul className="text-xs text-blue-100 space-y-1">
                      <li>• Status individual dos backends</li>
                      <li>• Tempo de resposta</li>
                      <li>• Histórico de health checks</li>
                      <li>• Alertas de falhas</li>
                    </ul>
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-purple-400" />
                      Backends
                    </h4>
                    <p className="text-blue-200 text-sm mb-3">
                      Gerenciamento completo dos servidores backend
                    </p>
                    <ul className="text-xs text-blue-100 space-y-1">
                      <li>• Adicionar/remover backends</li>
                      <li>• Configurar pesos</li>
                      <li>• Definir health checks</li>
                      <li>• Ativar/desativar servidores</li>
                    </ul>
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-red-400" />
                      Security
                    </h4>
                    <p className="text-blue-200 text-sm mb-3">
                      Configurações de segurança e proteção
                    </p>
                    <ul className="text-xs text-blue-100 space-y-1">
                      <li>• WAF (Web Application Firewall)</li>
                      <li>• Rate limiting por IP</li>
                      <li>• Regras de bloqueio</li>
                      <li>• Logs de segurança</li>
                    </ul>
                  </Card>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => navigate('/dashboard')}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Acessar Dashboard Agora
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Configuração */}
          <TabsContent value="configuration" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <FileText className="w-8 h-8 mr-3 text-yellow-400" />
                Configuração Detalhada
              </h2>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="basic-config" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    Configuração Básica (config.yaml)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="bg-black/50 rounded-lg p-4">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`# Configuração básica para iniciantes
global:
  # Endereços onde o load balancer vai escutar
  bind_address: "0.0.0.0:80"          # HTTP
  tls_bind_address: "0.0.0.0:443"     # HTTPS
  metrics_address: "0.0.0.0:8080"     # Métricas
  
  # HTTPS automático
  tls:
    auto_cert: true                    # Ativa certificados automáticos
    acme_email: "admin@meusite.com"    # Seu email para Let's Encrypt
    cert_dir: "/etc/ssl/certs"         # Onde guardar certificados

# Grupos de servidores
pools:
  - name: "meu-site"                   # Nome do grupo
    algorithm: "round_robin"           # Como distribuir requisições
    backends:
      - address: "192.168.1.100:8080" # Servidor 1
        weight: 100                    # Peso (mais peso = mais requisições)
      - address: "192.168.1.101:8080" # Servidor 2
        weight: 100

# Regras de roteamento
routes:
  - host: "meusite.com"               # Domínio
    pool: "meu-site"                  # Qual grupo usar`}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="advanced-config" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    Configuração Avançada
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="bg-black/50 rounded-lg p-4">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  
  # Health checks globais
  health_check:
    interval: "30s"                   # Verificar a cada 30 segundos
    timeout: "5s"                     # Timeout de 5 segundos
    retries: 3                        # 3 tentativas antes de marcar como down
  
  # Rate limiting
  rate_limit:
    requests_per_second: 100          # 100 req/s por IP
    burst_size: 200                   # Rajada de até 200 requisições
    cleanup_interval: "5m"            # Limpeza a cada 5 minutos
  
  # WAF (Web Application Firewall)
  waf:
    enabled: true                     # Ativar proteção
    level: "standard"                 # Nível de proteção
  
  # GeoIP (roteamento por localização)
  geoip:
    enabled: true
    database_path: "/etc/geoip/GeoLite2-City.mmdb"

# Clustering (múltiplas instâncias)
cluster:
  enabled: true                       # Ativar clustering
  redis_address: "redis:6379"         # Servidor Redis para sincronização
  node_id: "lb-node-1"               # ID único desta instância

pools:
  - name: "api-servers"
    algorithm: "least_conn"           # Servidor com menos conexões
    sticky_sessions: true             # Manter usuário no mesmo servidor
    
    backends:
      - address: "api-1:8080"
        weight: 100
        health_check:
          path: "/health"             # Endpoint específico para verificação
          interval: "15s"
          timeout: "3s"
          
      - address: "api-2:8080"
        weight: 150                   # Servidor mais potente = mais peso
        health_check:
          path: "/health"

routes:
  - host: "api.meusite.com"
    pool: "api-servers"
    path_prefix: "/api"               # Apenas URLs que começam com /api
    
  - host: "www.meusite.com"
    pool: "web-servers"
    redirect_https: true              # Forçar HTTPS`}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="algorithms" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    Algoritmos de Balanceamento
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-blue-600/20 border-blue-500/30 p-4">
                        <h4 className="text-white font-semibold mb-2">round_robin</h4>
                        <p className="text-blue-100 text-sm mb-2">
                          Distribui requisições em sequência circular
                        </p>
                        <p className="text-xs text-blue-200">
                          <strong>Use quando:</strong> Servidores têm capacidade similar
                        </p>
                      </Card>

                      <Card className="bg-green-600/20 border-green-500/30 p-4">
                        <h4 className="text-white font-semibold mb-2">least_conn</h4>
                        <p className="text-blue-100 text-sm mb-2">
                          Envia para o servidor com menos conexões ativas
                        </p>
                        <p className="text-xs text-blue-200">
                          <strong>Use quando:</strong> Requisições têm duração variável
                        </p>
                      </Card>

                      <Card className="bg-purple-600/20 border-purple-500/30 p-4">
                        <h4 className="text-white font-semibold mb-2">ip_hash</h4>
                        <p className="text-blue-100 text-sm mb-2">
                          Usa hash do IP para determinar servidor
                        </p>
                        <p className="text-xs text-blue-200">
                          <strong>Use quando:</strong> Precisa de sessões persistentes
                        </p>
                      </Card>

                      <Card className="bg-yellow-600/20 border-yellow-500/30 p-4">
                        <h4 className="text-white font-semibold mb-2">weighted</h4>
                        <p className="text-blue-100 text-sm mb-2">
                          Distribui baseado no peso de cada servidor
                        </p>
                        <p className="text-xs text-blue-200">
                          <strong>Use quando:</strong> Servidores têm capacidades diferentes
                        </p>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </TabsContent>

          {/* Avançado */}
          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Code className="w-8 h-8 mr-3 text-red-400" />
                Configurações Avançadas
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Clustering Multi-Região</h3>
                  <p className="text-blue-200 mb-4">
                    Configure múltiplas instâncias do VeloFlux LB para alta disponibilidade global:
                  </p>
                  
                  <div className="bg-black/50 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# Configuração para instância em São Paulo
cluster:
  enabled: true
  redis_address: "redis-cluster.internal:6379"
  redis_password: "senha-secreta"
  node_id: "sp-lb-01"
  region: "sa-east-1"
  heartbeat_interval: "5s"
  leader_timeout: "15s"

pools:
  - name: "web-global"
    algorithm: "geo_hash"            # Roteamento baseado em geolocalização
    backends:
      - address: "web-sp-1:8080"
        weight: 100
        region: "sa-east-1"
      - address: "web-us-1:8080"
        weight: 100
        region: "us-east-1"
        backup: true                 # Backup para quando SP falhar`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Segurança Avançada</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-semibold mb-3">WAF (Web Application Firewall)</h4>
                      <div className="bg-black/50 rounded-lg p-4">
                        <pre className="text-green-400 text-sm overflow-x-auto">
{`waf:
  enabled: true
  ruleset_path: "/etc/waf/rules"
  level: "paranoid"              # paranoid/standard/basic
  block_mode: true               # true=bloquear, false=apenas log
  
  # Regras customizadas
  custom_rules:
    - id: "CUSTOM-001"
      description: "Bloquear /admin para IPs externos"
      rule: |
        SecRule REQUEST_URI "@contains /admin" \\
        "id:90001,phase:1,deny,msg:'Admin access denied'"
      
  # Whitelist de IPs
  whitelist_ips:
    - "192.168.1.0/24"           # Rede interna
    - "10.0.0.0/8"               # Rede corporativa`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-3">Rate Limiting Avançado</h4>
                      <div className="bg-black/50 rounded-lg p-4">
                        <pre className="text-green-400 text-sm overflow-x-auto">
{`rate_limit:
  # Rate limiting global
  global:
    requests_per_second: 1000
    burst_size: 2000
  
  # Rate limiting por rota
  routes:
    "/api/login":
      requests_per_second: 5      # Limite para login
      burst_size: 10
      window: "1m"
      
    "/api/upload":
      requests_per_second: 10
      burst_size: 20
      
  # Rate limiting por IP/CIDR
  ip_rules:
    "192.168.1.0/24":            # Rede interna
      requests_per_second: 10000  # Sem limite prático
      
    "0.0.0.0/0":                 # Internet (padrão)
      requests_per_second: 100`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Observabilidade Completa</h3>
                  
                  <div className="bg-black/50 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# Logs estruturados
logging:
  level: "info"                   # debug/info/warn/error
  format: "json"                  # json/text
  output: "/var/log/veloflux.log"
  max_size: "100MB"
  max_age: "30d"
  compress: true

# Métricas Prometheus
metrics:
  enabled: true
  path: "/metrics"
  port: 8080
  
  # Métricas customizadas
  custom_metrics:
    - name: "business_transactions_total"
      type: "counter"
      labels: ["method", "endpoint", "tenant"]
      
    - name: "response_size_bytes"
      type: "histogram"
      buckets: [100, 1000, 10000, 100000]

# Tracing distribuído
tracing:
  enabled: true
  jaeger:
    endpoint: "http://jaeger:14268/api/traces"
    service_name: "veloflux-lb"`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Multi-Tenancy (SaaS)</h3>
                  <p className="text-blue-200 mb-4">
                    Configure VeloFlux LB para servir múltiplos clientes com isolamento:
                  </p>
                  
                  <div className="bg-black/50 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# Configuração multi-tenant
tenants:
  - id: "cliente-a"
    name: "Empresa A"
    routes:
      - host: "empresa-a.meuapp.com"
        pool: "empresa-a-servers"
    rate_limit:
      requests_per_second: 1000     # Plano premium
    waf:
      level: "standard"
      
  - id: "cliente-b"
    name: "Empresa B"
    routes:
      - host: "empresa-b.meuapp.com"
        pool: "empresa-b-servers"
    rate_limit:
      requests_per_second: 100      # Plano básico
    waf:
      level: "basic"

# Pools isolados por tenant
pools:
  - name: "empresa-a-servers"
    tenant: "cliente-a"
    algorithm: "least_conn"
    backends:
      - address: "app-a-1:8080"
      - address: "app-a-2:8080"
      
  - name: "empresa-b-servers"
    tenant: "cliente-b"
    algorithm: "round_robin"
    backends:
      - address: "app-b-1:8080"`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
                    <Zap className="w-6 h-6 mr-2 text-orange-400" />
                    Integração com CDN (Cloudflare/Outros)
                  </h3>
                  <p className="text-blue-200 mb-4">
                    Maximize o desempenho e segurança do VeloFlux ao combiná-lo com uma CDN, mesmo usando planos gratuitos:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card className="bg-gradient-to-br from-orange-900/30 to-blue-900/30 border-orange-500/20 p-5">
                      <h4 className="text-white font-semibold text-lg flex items-center mb-3">
                        <Wifi className="w-5 h-5 mr-2 text-orange-400" />
                        Benefícios da Integração
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start text-blue-200">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                          <span><strong className="text-white">Latência global reduzida</strong>: Conteúdo distribuído através de servidores em todo o mundo</span>
                        </li>
                        <li className="flex items-start text-blue-200">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                          <span><strong className="text-white">Proteção contra DDoS</strong>: Absorção de ataques antes de atingirem seu VeloFlux</span>
                        </li>
                        <li className="flex items-start text-blue-200">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                          <span><strong className="text-white">Cache de borda</strong>: Reduz drasticamente o tráfego direto aos seus servidores</span>
                        </li>
                        <li className="flex items-start text-blue-200">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                          <span><strong className="text-white">Camada extra de WAF</strong>: Complementa as proteções do VeloFlux</span>
                        </li>
                        <li className="flex items-start text-blue-200">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-1 flex-shrink-0" />
                          <span><strong className="text-white">SSL/TLS gerenciado</strong>: Renovação automática de certificados</span>
                        </li>
                      </ul>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-blue-900/30 to-orange-900/30 border-blue-500/20 p-5">
                      <h4 className="text-white font-semibold text-lg flex items-center mb-3">
                        <Settings className="w-5 h-5 mr-2 text-blue-400" />
                        Configuração com Cloudflare (Free)
                      </h4>
                      <ol className="space-y-2 text-blue-200 list-decimal list-inside">
                        <li>Crie uma conta gratuita no <strong className="text-white">Cloudflare</strong></li>
                        <li>Adicione seu domínio e siga o processo de transferência dos nameservers</li>
                        <li>Configure regras de cache para arquivos estáticos (JS, CSS, imagens)</li>
                        <li>Ative o <strong className="text-white">modo Proxy</strong> (ícone laranja) para seus subdomínios</li>
                        <li>Em <strong className="text-white">SSL/TLS</strong>, configure para "Full" ou "Full (Strict)"</li>
                        <li>Ative o <strong className="text-white">Always Use HTTPS</strong> em SSL/TLS</li>
                        <li>Configure <strong className="text-white">Page Rules</strong> para cache específico de rotas</li>
                      </ol>
                    </Card>
                  </div>
                  
                  <div className="bg-black/50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-300 mb-3">Regras de Cache Otimizadas para Cloudflare</h4>
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# No arquivo .htaccess ou configuração do Nginx
# Maximiza a eficiência do cache

# Permitir que o Cloudflare cache conteúdo estático por 7 dias
<FilesMatch "\\.(jpg|jpeg|png|gif|ico|css|js)$">
  Header set Cache-Control "public, max-age=604800"
</FilesMatch>

# No dashboard do Cloudflare, crie Page Rules:
# 1. Para arquivos estáticos:
# URL Pattern: *example.com/static/*
# Setting: Cache Level: Cache Everything, Edge Cache TTL: 7 days

# 2. Para bypass em áreas dinâmicas:
# URL Pattern: *example.com/api/*
# Setting: Cache Level: Bypass`}
                    </pre>
                  </div>
                  
                  <div className="mt-6 bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4">
                    <h4 className="text-indigo-300 font-semibold flex items-center mb-2">
                      <Zap className="w-5 h-5 mr-2" />
                      Por que funciona tão bem com plano Free
                    </h4>
                    <p className="text-indigo-100 text-sm mb-3">
                      O VeloFlux e o Cloudflare Free se complementam perfeitamente, criando uma arquitetura robusta com:
                    </p>
                    <ul className="text-indigo-100 text-sm space-y-2 list-disc list-inside">
                      <li>Cloudflare lida com <strong>picos de tráfego e DDoS</strong> na borda, reduzindo carga no seu servidor</li>
                      <li>VeloFlux manipula <strong>balanceamento inteligente</strong> entre seus servidores internos</li>
                      <li>Cache de borda <strong>reduz até 70%</strong> das requisições aos seus servidores de origem</li> 
                      <li>Ambos fornecem <strong>métricas complementares</strong>: Cloudflare mostra dados de borda, VeloFlux mostra performance do backend</li>
                      <li>O <strong>WAF multi-camadas</strong> (Cloudflare + VeloFlux) bloqueia ataques em diferentes pontos</li>
                      <li>Você obtém presença global <strong>sem precificar servidores em múltiplas regiões</strong></li>
                    </ul>
                  </div>
                </div>

              </div>
            </Card>
          </TabsContent>

          {/* API */}
          <TabsContent value="api" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Terminal className="w-8 h-8 mr-3 text-green-400" />
                API REST - Automação e Integração
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Autenticação</h3>
                  <p className="text-blue-200 mb-4">
                    A API usa autenticação Basic Auth ou JWT tokens:
                  </p>
                  
                  <div className="bg-black/50 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# Basic Auth
curl -u admin:senha \\
  http://localhost:9000/api/pools

# JWT Token (após login)
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \\
  http://localhost:9000/api/pools`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Endpoints Principais</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-semibold mb-3">Gerenciamento de Pools</h4>
                      <div className="bg-black/50 rounded-lg p-4">
                        <pre className="text-green-400 text-sm overflow-x-auto">
{`# Listar todos os pools
GET /api/pools

# Criar/atualizar pool
POST /api/pools
{
  "name": "web-servers",
  "algorithm": "round_robin",
  "backends": [
    {
      "address": "192.168.1.100:8080",
      "weight": 100,
      "health_check": {
        "path": "/health",
        "interval": "30s"
      }
    }
  ]
}

# Deletar pool
DELETE /api/pools/web-servers`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-3">Gerenciamento de Backends</h4>
                      <div className="bg-black/50 rounded-lg p-4">
                        <pre className="text-green-400 text-sm overflow-x-auto">
{`# Adicionar backend a um pool
POST /api/pools/web-servers/backends
{
  "address": "192.168.1.101:8080",
  "weight": 100,
  "region": "sa-east-1"
}

# Remover backend
DELETE /api/backends/web-servers/192.168.1.101:8080

# Marcar backend como maintenance
PATCH /api/backends/web-servers/192.168.1.101:8080
{
  "maintenance": true
}`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-3">Configuração e Status</h4>
                      <div className="bg-black/50 rounded-lg p-4">
                        <pre className="text-green-400 text-sm overflow-x-auto">
{`# Status geral do sistema
GET /api/status

# Recarregar configuração
POST /api/reload

# Informações do cluster
GET /api/cluster

# Drenar conexões (rolling update)
POST /api/drain

# Health check de um backend específico
GET /api/health/web-servers/192.168.1.100:8080`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-3">Métricas e Monitoramento</h4>
                      <div className="bg-black/50 rounded-lg p-4">
                        <pre className="text-green-400 text-sm overflow-x-auto">
{`# Métricas Prometheus
GET /metrics

# Estatísticas por pool
GET /api/stats/pools

# Logs recentes
GET /api/logs?lines=100&level=error

# Estatísticas de rate limiting
GET /api/ratelimit/stats`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-300 mb-4">Exemplos de Automação</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-semibold mb-3">Script de Deploy Automático</h4>
                      <div className="bg-black/50 rounded-lg p-4">
                        <pre className="text-green-400 text-sm overflow-x-auto">
{`#!/bin/bash
# deploy.sh - Script para deploy zero-downtime

NEW_BACKEND="app-new:8080"
POOL="web-servers"
LB_URL="http://lb:9000"

# 1. Adicionar novo backend
curl -u admin:senha \\
  -X POST "$LB_URL/api/pools/$POOL/backends" \\
  -d '{"address":"'$NEW_BACKEND'","weight":100}'

# 2. Aguardar health check passar
while ! curl -s "$LB_URL/api/health/$POOL/$NEW_BACKEND" | grep -q "healthy"; do
  echo "Aguardando backend ficar saudável..."
  sleep 5
done

# 3. Drenar backends antigos
curl -u admin:senha \\
  -X POST "$LB_URL/api/drain"

# 4. Remover backends antigos após drain
sleep 30
curl -u admin:senha \\
  -X DELETE "$LB_URL/api/backends/$POOL/app-old:8080"`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-3">Monitoramento com Python</h4>
                      <div className="bg-black/50 rounded-lg p-4">
                        <pre className="text-green-400 text-sm overflow-x-auto">
{`import requests
import time

def monitor_backends():
    while True:
        try:
            response = requests.get(
                'http://lb:9000/api/status',
                auth=('admin', 'senha')
            )
            
            status = response.json()
            
            for pool in status['pools']:
                unhealthy = [b for b in pool['backends'] 
                           if not b['healthy']]
                
                if unhealthy:
                    # Enviar alerta
                    send_alert(f"Pool {pool['name']} tem "
                             f"{len(unhealthy)} backends down")
                             
        except Exception as e:
            print(f"Erro no monitoramento: {e}")
            
        time.sleep(30)

monitor_backends()`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Solução de Problemas */}
          <TabsContent value="troubleshooting" className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <AlertCircle className="w-8 h-8 mr-3 text-red-400" />
                Solução de Problemas
              </h2>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="common-issues" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    Problemas Comuns e Soluções
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4">
                        <h4 className="text-red-300 font-semibold mb-2">❌ Load Balancer não inicia</h4>
                        <div className="text-sm text-red-100 space-y-2">
                          <p><strong>Sintomas:</strong> Container falha ao iniciar, erro "bind: address already in use"</p>
                          <p><strong>Causa:</strong> Porta já está em uso</p>
                          <p><strong>Solução:</strong></p>
                          <div className="bg-black/50 rounded p-2 mt-2">
                            <code className="text-green-400">
                              # Verificar portas em uso<br/>
                              netstat -tulpn | grep :80<br/>
                              # Parar processo que usa a porta<br/>
                              sudo kill $(lsof -t -i:80)
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                        <h4 className="text-yellow-300 font-semibold mb-2">⚠️ Backends marcados como unhealthy</h4>
                        <div className="text-sm text-yellow-100 space-y-2">
                          <p><strong>Sintomas:</strong> Dashboard mostra backends em vermelho</p>
                          <p><strong>Verificações:</strong></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Backend está realmente rodando?</li>
                            <li>Endpoint de health check responde?</li>
                            <li>Firewall/rede permite conexão?</li>
                            <li>Timeout muito baixo?</li>
                          </ul>
                          <div className="bg-black/50 rounded p-2 mt-2">
                            <code className="text-green-400">
                              # Testar health check manualmente<br/>
                              curl -v http://backend:8080/health
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                        <h4 className="text-blue-300 font-semibold mb-2">🔧 Certificado SSL não é obtido</h4>
                        <div className="text-sm text-blue-100 space-y-2">
                          <p><strong>Requisitos para Let's Encrypt:</strong></p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Portas 80 e 443 acessíveis da internet</li>
                            <li>DNS apontando para o servidor</li>
                            <li>Email válido configurado</li>
                          </ul>
                          <div className="bg-black/50 rounded p-2 mt-2">
                            <code className="text-green-400">
                              # Verificar DNS<br/>
                              nslookup meusite.com<br/>
                              # Testar acesso HTTP<br/>
                              curl -v http://meusite.com/.well-known/acme-challenge/test
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="debug-commands" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    Comandos de Debug e Diagnóstico
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="bg-black/50 rounded-lg p-4">
                      <h4 className="text-blue-300 font-semibold mb-3">Verificações Básicas</h4>
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`# Status dos containers
docker ps -a | grep veloflux

# Logs do load balancer
docker logs veloflux-lb -f

# Verificar configuração
docker exec veloflux-lb cat /etc/veloflux/config.yaml

# Testar conectividade com backend
docker exec veloflux-lb wget -qO- http://backend:8080/health

# Verificar uso de recursos
docker stats veloflux-lb`}
                      </pre>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4">
                      <h4 className="text-blue-300 font-semibold mb-3">Análise de Rede</h4>
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`# Verificar portas abertas
netstat -tulpn | grep veloflux

# Testar resolução DNS
dig meusite.com

# Verificar rota de rede
traceroute backend-server

# Monitorar tráfego
tcpdump -i any -n port 80

# Verificar firewall
iptables -L -n`}
                      </pre>
                    </div>

                    <div className="bg-black/50 rounded-lg p-4">
                      <h4 className="text-blue-300 font-semibold mb-3">Métricas e Performance</h4>
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`# Métricas em tempo real
curl -s http://localhost:8080/metrics | grep veloflux

# Status da API
curl -u admin:senha http://localhost:9000/api/status

# Health checks
curl -u admin:senha http://localhost:9000/api/health

# Estatísticas de conexões
ss -tuln | grep :80`}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="performance" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    Otimização de Performance
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">Configurações de Sistema</h4>
                        <div className="bg-black/50 rounded-lg p-4">
                          <pre className="text-green-400 text-sm overflow-x-auto">
{`# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_congestion_control = bbr

# Aplicar mudanças
sysctl -p`}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-3">Limites de Container</h4>
                        <div className="bg-black/50 rounded-lg p-4">
                          <pre className="text-green-400 text-sm overflow-x-auto">
{`# docker-compose.yml
services:
  veloflux-lb:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '1.0'
          memory: 512M
    ulimits:
      nofile: 65535`}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 mt-4">
                      <h4 className="text-green-300 font-semibold mb-2">💡 Dicas de Performance</h4>
                      <ul className="text-green-100 text-sm space-y-1">
                        <li>• Use algoritmo `least_conn` para workloads com duração variável</li>
                        <li>• Configure health checks com intervalos apropriados (30s é um bom padrão)</li>
                        <li>• Habilite keep-alive nos backends</li>
                        <li>• Use compressão gzip quando possível</li>
                        <li>• Configure cache headers apropriados</li>
                        <li>• Monitore métricas regularmente</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="support" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-blue-300">
                    Obtendo Suporte
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-blue-600/20 border-blue-500/30 p-4">
                        <h4 className="text-white font-semibold mb-2 flex items-center">
                          <FileText className="w-5 h-5 mr-2" />
                          Documentação
                        </h4>
                        <ul className="text-blue-100 text-sm space-y-1">
                          <li>• <a href="https://docs.veloflux.io" className="hover:text-white">docs.veloflux.io</a></li>
                          <li>• README.md no GitHub</li>
                          <li>• Exemplos na pasta /examples</li>
                        </ul>
                      </Card>

                      <Card className="bg-green-600/20 border-green-500/30 p-4">
                        <h4 className="text-white font-semibold mb-2 flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          Comunidade
                        </h4>
                        <ul className="text-green-100 text-sm space-y-1">
                          <li>• GitHub Issues</li>
                          <li>• Discord: veloflux.io/discord</li>
                          <li>• Stack Overflow (tag: veloflux)</li>
                        </ul>
                      </Card>
                    </div>

                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                      <h4 className="text-purple-300 font-semibold mb-2">📝 Antes de Pedir Ajuda</h4>
                      <p className="text-purple-100 text-sm mb-3">
                        Para acelerar o suporte, inclua sempre essas informações:
                      </p>
                      <ul className="text-purple-100 text-sm space-y-1 list-disc list-inside">
                        <li>Versão do VeloFlux LB (`docker image inspect`)</li>
                        <li>Sistema operacional e versão</li>
                        <li>Arquivo de configuração (sem senhas)</li>
                        <li>Logs de erro completos</li>
                        <li>Passos para reproduzir o problema</li>
                        <li>Comportamento esperado vs atual</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Acessar Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-400/50 text-blue-100 hover:bg-blue-600/20"
              onClick={() => navigate('/register')}
            >
              <Users className="w-4 h-4 mr-2" />
              Criar Conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
