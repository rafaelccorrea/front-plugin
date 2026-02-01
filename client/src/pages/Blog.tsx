import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, User, ArrowRight } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
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
    excerpt: "Descubra técnicas comprovadas que aumentam a taxa de conversão em até 40% no setor imobiliário.",
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
    excerpt: "Aprenda como a inteligência artificial pode revolucionar seu processo de qualificação de leads.",
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
    excerpt: "Conheça as principais tendências que vão marcar o setor imobiliário nos próximos meses.",
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

const CATEGORIES = ["Todos", "Vendas", "Tecnologia", "Mercado"];

export default function Blog() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todos" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Blog ChatLead Pro</h1>
          <p className="text-xl text-blue-100">
            Dicas, estratégias e insights sobre vendas imobiliárias e tecnologia
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <Input
              placeholder="Buscar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/blog/${post.id}`)}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-gray-200">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
                <Badge className="absolute top-4 right-4">{post.category}</Badge>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(post.date).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    {post.author}
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  {post.readTime} min de leitura
                </div>

                {/* CTA */}
                <Button
                  variant="ghost"
                  className="w-full justify-between group"
                  onClick={() => navigate(`/blog/${post.id}`)}
                >
                  Ler artigo
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum artigo encontrado. Tente outra busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
