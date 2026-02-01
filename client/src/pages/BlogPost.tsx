import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { Streamdown } from "streamdown";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: number;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "5 Estratégias de SDR para Aumentar Conversão em Vendas Imobiliárias",
    content: `# 5 Estratégias de SDR para Aumentar Conversão em Vendas Imobiliárias

A venda de imóveis é uma das profissões mais desafiadoras do mercado. Com a concorrência cada vez maior, é essencial ter estratégias eficazes para se destacar. Neste artigo, vamos compartilhar 5 estratégias de SDR (Sales Development Representative) que podem aumentar sua taxa de conversão em até 40%.

## 1. Segmentação de Leads

A segmentação é fundamental para personalizar sua abordagem. Divida seus leads em categorias como:
- Compradores de primeira vez
- Investidores
- Relocação profissional
- Upgrade de imóvel

## 2. Follow-up Automático

Não deixe leads esfriar. Configure um sistema de follow-up automático que:
- Envia mensagens em horários estratégicos
- Personaliza conteúdo baseado no perfil
- Rastreia engajamento

## 3. Conteúdo Personalizado

Cada lead é único. Crie conteúdo que fale diretamente com suas necessidades e desejos.

## 4. Análise de Dados

Use dados para entender o que funciona e o que não funciona em sua estratégia de vendas.

## 5. Treinamento Contínuo

Invista em treinamento regular da sua equipe para manter as habilidades atualizadas.`,
    author: "Rafael Correia",
    date: "2026-01-28",
    category: "Vendas",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
    readTime: 5,
  },
  {
    id: "2",
    title: "Como Usar IA para Qualificar Leads Imobiliários",
    content: `# Como Usar IA para Qualificar Leads Imobiliários

A inteligência artificial está transformando a forma como qualificamos e convertemos leads no setor imobiliário. Descubra como implementar IA em seu processo de vendas.

## Benefícios da IA na Qualificação

- Análise automática de intenção de compra
- Identificação de leads de alta qualidade
- Previsão de probabilidade de conversão
- Otimização de tempo do vendedor

## Implementação Prática

1. Integre IA em seu CRM
2. Configure regras de qualificação automática
3. Monitore e ajuste continuamente
4. Treine sua equipe no novo processo`,
    author: "Maria Silva",
    date: "2026-01-25",
    category: "Tecnologia",
    image: "https://images.unsplash.com/photo-1677442d019cecf8d4b4c0ea0f1e4b04?w=800&h=400&fit=crop",
    readTime: 7,
  },
  {
    id: "3",
    title: "Tendências do Mercado Imobiliário em 2026",
    content: `# Tendências do Mercado Imobiliário em 2026

O mercado imobiliário está em constante evolução. Confira as principais tendências que você precisa acompanhar em 2026.

## Principais Tendências

### 1. Imóveis Sustentáveis
Cada vez mais compradores buscam imóveis com certificação ambiental e eficiência energética.

### 2. Trabalho Remoto
A flexibilidade de trabalho aumentou a demanda por imóveis em áreas periféricas com melhor qualidade de vida.

### 3. Tecnologia Imobiliária
Tours virtuais, realidade aumentada e IA estão revolucionando a forma de vender imóveis.

### 4. Investimento em Imóveis
O mercado de investimento imobiliário continua aquecido com retornos atrativos.`,
    author: "João Santos",
    date: "2026-01-20",
    category: "Mercado",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop",
    readTime: 6,
  },
];

export default function BlogPost() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/blog/:id");

  if (!match) {
    return null;
  }

  const post = BLOG_POSTS.find((p) => p.id === params?.id);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <Button onClick={() => navigate("/blog")}>Voltar ao blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-blue-700 mb-6"
            onClick={() => navigate("/blog")}
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar ao blog
          </Button>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex flex-wrap gap-6 text-blue-100">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              {new Date(post.date).toLocaleDateString("pt-BR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center gap-2">
              <User size={18} />
              {post.author}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} />
              {post.readTime} min de leitura
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="w-full h-96 overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <article className="prose prose-lg max-w-none">
            <Streamdown>{post.content}</Streamdown>
          </article>

          {/* CTA Section */}
          <div className="mt-16 p-8 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para transformar suas vendas?
            </h3>
            <p className="text-gray-700 mb-6">
              Comece a usar ChatLead Pro hoje e veja como a IA pode revolucionar seu
              processo de vendas imobiliárias.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/pricing")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Começar Agora
            </Button>
          </div>

          {/* Related Posts */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-8">Artigos Relacionados</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {BLOG_POSTS.filter((p) => p.id !== post.id)
                .slice(0, 2)
                .map((relatedPost) => (
                  <div
                    key={relatedPost.id}
                    className="p-4 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/blog/${relatedPost.id}`)}
                  >
                    <h4 className="font-bold mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {relatedPost.readTime} min de leitura
                    </p>
                    <Button variant="ghost" className="w-full justify-start">
                      Ler mais →
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
