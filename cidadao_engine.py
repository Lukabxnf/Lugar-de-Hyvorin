"""
CIDADÃO - Motor de Simulação de Vida, Negócios, Macroeconomia e Política Brasileira.

Módulo determinístico, modular e sem dependências externas (Python 3.10+).
Pilares:
  1. Vida Pessoal (Saúde, Felicidade, Intelecto, Reputação, Renda e Moradia)
  2. Gestão Empresarial (Capacidade, Insumos com Inflação, Folha, Preços e Lucro)
  3. Macroeconomia (Regra de Taylor dinâmica, Hiato do Produto, IPCA, Selic, Desemprego e Dívida Pública)
  4. Política & Governança (Cargos hierárquicos, Calendário Eleitoral quadrienal e Leis)
"""

from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class EsferaGoverno(str, Enum):
    NENHUMA = "nenhuma"
    MUNICIPAL = "municipal"
    ESTADUAL = "estadual"
    FEDERAL = "federal"


class CargoPoliticoId(str, Enum):
    CIDADAO = "cidadao"
    LIDER_COMUNITARIO = "lider_comunitario"
    VEREADOR = "vereador"
    PREFEITO = "prefeito"
    DEPUTADO_ESTADUAL = "deputado_estadual"
    DEPUTADO_FEDERAL = "deputado_federal"
    SENADOR = "senador"
    GOVERNADOR = "governador"
    PRESIDENTE = "presidente"


@dataclass
class Vida:
    nome: str = "Cidadão Brasileiro"
    idade: int = 25
    meses_vividos: int = 300
    saldo_bancario: float = 5000.0
    divida_pessoal: float = 0.0
    saude: float = 85.0  # 0 a 100
    felicidade: float = 80.0  # 0 a 100
    intelecto: float = 45.0  # 0 a 100
    reputacao: float = 40.0  # 0 a 100
    rede_contatos: float = 35.0  # 0 a 100
    moradia: str = "aluguel_simples"
    casa_propria: bool = False
    educacao: str = "medio"  # medio, superior, pos_mba
    salario_trabalho: float = 1600.0

    def simular_mes(self, taxa_selic_aa: float, salario_politico: float = 0.0) -> List[str]:
        logs: List[str] = []
        self.meses_vividos += 1
        if self.meses_vividos % 12 == 0:
            self.idade += 1
            logs.append(f"Aniversário: Você completou {self.idade} anos!")

        # Rendimento de poupança/CDI ou juros de dívida
        if self.saldo_bancario > 0:
            taxa_cdi_am = ((taxa_selic_aa - 0.2) / 100.0) / 12.0
            rendimento = self.saldo_bancario * taxa_cdi_am
            self.saldo_bancario += rendimento
        elif self.saldo_bancario < 0:
            self.divida_pessoal += abs(self.saldo_bancario)
            self.saldo_bancario = 0.0

        if self.divida_pessoal > 0:
            juros_am = ((taxa_selic_aa + 18.0) / 100.0) / 12.0
            self.divida_pessoal += self.divida_pessoal * juros_am

        # Custos de vida
        custos_moradia = 1400.0 if not self.casa_propria else 420.0
        custos_vida = 1100.0
        despesas = custos_moradia + custos_vida

        # Renda total
        renda_ativa = max(self.salario_trabalho, salario_politico)
        fluxo_liquido = renda_ativa - despesas
        self.saldo_bancario += fluxo_liquido

        if self.saldo_bancario < 0:
            self.divida_pessoal += abs(self.saldo_bancario)
            self.saldo_bancario = 0.0
            logs.append("Alerta: Saldo negativo convertido em dívida bancária rotativa.")

        # Efeito na felicidade e saúde
        if self.divida_pessoal > 20000.0:
            self.felicidade = max(5.0, self.felicidade - 2.0)
            self.saude = max(10.0, self.saude - 1.0)
        elif self.saldo_bancario > 50000.0:
            self.felicidade = min(100.0, self.felicidade + 1.0)

        # Networking cresce com reputação
        self.rede_contatos = min(100.0, self.rede_contatos + (self.reputacao * 0.01))
        return logs


@dataclass
class Empresa:
    nome: str
    setor: str = "tecnologia"  # tecnologia, varejo, agro, industria, servicos
    porte: str = "LTDA"
    funcionarios: int = 5
    salario_medio: float = 4000.0
    capacidade_maquinas: int = 500
    preco_venda: float = 120.0
    estoque: int = 50
    caixa_pj: float = 50000.0
    divida_pj: float = 0.0
    patrimonio_maquinas: float = 60000.0
    ativa: bool = True
    ultimo_lucro: float = 0.0

    def simular_mes(self, taxa_selic_aa: float, inflacao_aa: float, pib_crescimento: float, cambio_dolar: float) -> List[str]:
        if not self.ativa:
            return ["Empresa inativa."]

        logs: List[str] = []
        produtividade = 80  # unidades por funcionário
        capacidade_real = min(self.funcionarios * produtividade, self.capacidade_maquinas)
        unidades_produzidas = capacidade_real
        total_disponivel = self.estoque + unidades_produzidas

        # Demanda baseada no PIB e Preço
        demanda_base = 600
        fator_preco = max(0.1, (120.0 / max(1.0, self.preco_venda)) ** 1.3)
        fator_macro = 1.0 + (pib_crescimento / 100.0) - ((taxa_selic_aa - 10.0) / 100.0)
        demanda_final = max(10, int(demanda_base * fator_preco * max(0.5, fator_macro)))

        unidades_vendidas = min(demanda_final, total_disponivel)
        self.estoque = max(0, total_disponivel - unidades_vendidas)

        # DRE
        receita = unidades_vendidas * self.preco_venda
        custo_insumos = unidades_produzidas * (15.0 * (1.0 + (inflacao_aa / 1200.0)))
        custo_folha = self.funcionarios * self.salario_medio * 1.35  # encargos trabalhistas
        juros_divida = (self.divida_pj * ((taxa_selic_aa + 8.0) / 100.0)) / 12.0
        impostos = receita * 0.12

        lucro_liquido = receita - (custo_insumos + custo_folha + juros_divida + impostos)
        self.ultimo_lucro = lucro_liquido
        self.caixa_pj += lucro_liquido

        if self.caixa_pj < -100000.0 and self.divida_pj > self.patrimonio_maquinas * 2:
            self.ativa = False
            logs.append(f"A empresa {self.nome} declarou autofalência devido ao passivo impagável.")
        elif lucro_liquido > 0:
            logs.append(f"{self.nome}: Lucro líquido mensal de R$ {lucro_liquido:,.2f}.")
        else:
            logs.append(f"{self.nome}: Prejuízo operacional de R$ {abs(lucro_liquido):,.2f}.")

        return logs


@dataclass
class Economia:
    """
    Motor macroeconômico com política monetária dinâmica baseada na Regra de Taylor.
    
    A autoridade monetária (Banco Central / Copom) ajusta a taxa básica de juros (Selic)
    reagindo aos desvios da inflação em relação à meta e ao hiato do produto:
    
      i* = r_neutro + pi* + alpha * (pi - pi*) + beta * y_hiato
      i_t = rho * i_{t-1} + (1 - rho) * i*
    """
    pib: float = 11200.0  # R$ Bilhões (ex: 11.2 trilhões)
    crescimento_anual_pib: float = 2.3  # % a.a.
    crescimento_potencial: float = 2.0  # % a.a. (PIB potencial do Brasil)
    inflacao_ipca_12m: float = 4.1  # % a.a.
    meta_inflacao: float = 3.5  # % a.a.
    banda_tolerancia: float = 1.5  # % (intervalo de 2.0% a 5.0%)
    
    # Parâmetros da Política Monetária (Regra de Taylor)
    taxa_juros_selic: float = 10.75  # % a.a.
    taxa_neutra_real: float = 5.0  # Juro real neutro estimado para a economia brasileira
    alpha_inflacao: float = 1.50  # Ponderação do desvio da inflação (Princípio de Taylor: alpha > 1.0)
    beta_hiato: float = 0.50  # Ponderação do hiato do produto
    suavizacao_monetaria: float = 0.45  # Velocidade de convergência da taxa Selic por período
    passo_maximo_copom: float = 0.75  # Limite máximo de corte ou alta por reunião (ex: 75 bps)
    selic_piso: float = 2.0  # Taxa mínima nominal (zero lower bound prudencial)
    selic_teto: float = 24.0  # Taxa máxima nominal em crises severas

    # Demais agregados macroeconômicos
    hiato_produto: float = 0.30  # Diferença percentual entre produto efetivo e potencial
    taxa_desemprego: float = 7.1  # % da força de trabalho
    taxa_desemprego_natural: float = 7.5  # NAIRU
    cambio_dolar: float = 5.40  # BRL/USD
    divida_publica_pib: float = 76.8  # % do PIB
    resultado_primario_mes: float = -4.5  # R$ Bilhões (+ superávit, - déficit)
    arrecadacao_mes: float = 298.0  # R$ Bilhões
    despesa_mes: float = 302.5  # R$ Bilhões
    confianca_empresarial: float = 58.0  # 0 a 100
    risco_pais: int = 205  # EMBI+ em pontos base
    historico_atas_copom: List[str] = field(default_factory=list)

    def calcular_hiato_produto(self) -> float:
        """
        Calcula o hiato do produto (y_t): diferença entre crescimento efetivo e PIB potencial.
        """
        self.hiato_produto = round(self.crescimento_anual_pib - self.crescimento_potencial, 2)
        return self.hiato_produto

    def calcular_taxa_selic_alvo_taylor(self) -> float:
        """
        Aplica a formulação padrão da Regra de Taylor:
          i* = r* + pi* + alpha * (pi - pi*) + beta * y_hiato
        """
        desvio_inflacao = self.inflacao_ipca_12m - self.meta_inflacao
        hiato = self.calcular_hiato_produto()
        
        selic_alvo = (
            self.taxa_neutra_real
            + self.meta_inflacao
            + (self.alpha_inflacao * desvio_inflacao)
            + (self.beta_hiato * hiato)
        )
        return max(self.selic_piso, min(self.selic_teto, round(selic_alvo, 2)))

    def executar_politica_monetaria(self) -> str:
        """
        Ajusta dinamicamente a taxa Selic aplicando suavização e limites de movimentação do Copom.
        Retorna a ata oficial resumida da decisão.
        """
        selic_alvo = self.calcular_taxa_selic_alvo_taylor()
        delta_desejado = (selic_alvo - self.taxa_juros_selic) * self.suavizacao_monetaria
        
        # Limita a magnitude do ajuste mensal (clamping do passo)
        delta_efetivo = max(-self.passo_maximo_copom, min(self.passo_maximo_copom, delta_desejado))
        
        selic_anterior = self.taxa_juros_selic
        nova_selic = max(self.selic_piso, min(self.selic_teto, self.taxa_juros_selic + delta_efetivo))
        self.taxa_juros_selic = round(nova_selic, 2)

        # Elaboração da Ata do Copom
        desvio = self.inflacao_ipca_12m - self.meta_inflacao
        if self.taxa_juros_selic > selic_anterior:
            ata = (
                f"COPOM: Elevação da taxa Selic de {selic_anterior:.2f}% para {self.taxa_juros_selic:.2f}% a.a. "
                f"(Alvo Taylor: {selic_alvo:.2f}%). Decisão visa conter desvio inflacionário de {desvio:+.2f} p.p."
            )
        elif self.taxa_juros_selic < selic_anterior:
            ata = (
                f"COPOM: Redução da taxa Selic de {selic_anterior:.2f}% para {self.taxa_juros_selic:.2f}% a.a. "
                f"(Alvo Taylor: {selic_alvo:.2f}%). Decisão reflete ancoragem de preços e hiato de {self.hiato_produto:+.2f}%."
            )
        else:
            ata = (
                f"COPOM: Manutenção da taxa Selic em {self.taxa_juros_selic:.2f}% a.a. "
                f"(Alvo Taylor: {selic_alvo:.2f}%). Balanço de riscos para a inflação considerado estável."
            )

        self.historico_atas_copom.append(ata)
        if len(self.historico_atas_copom) > 24:
            self.historico_atas_copom.pop(0)
        return ata

    def simular_mes(self, choque_inflacao: float = 0.0, choque_pib: float = 0.0, gasto_extra_gov: float = 0.0) -> Dict[str, Any]:
        """
        Avança o ciclo macroeconômico em 1 mês integrando a política monetária aos demais agregados.
        """
        # 1. Incorpora choques exógenos prévios de oferta/demanda
        if choque_inflacao != 0.0:
            self.inflacao_ipca_12m = round(max(1.0, min(20.0, self.inflacao_ipca_12m + choque_inflacao)), 2)
        if choque_pib != 0.0:
            self.crescimento_anual_pib = round(max(-6.0, min(9.0, self.crescimento_anual_pib + choque_pib)), 2)
        self.calcular_hiato_produto()

        # 2. Executa política monetária pelo Banco Central (Regra de Taylor)
        ata_copom = self.executar_politica_monetaria()

        # 2. Transmissão monetária para o crescimento do PIB
        # Juro real = Selic - Inflação esperada
        juro_real = self.taxa_juros_selic - self.inflacao_ipca_12m
        aperto_monetario = juro_real - self.taxa_neutra_real

        novo_crescimento = (
            (self.crescimento_anual_pib * 0.85)
            + (self.crescimento_potencial * 0.15)
            - (aperto_monetario * 0.20)
            + choque_pib
        )
        self.crescimento_anual_pib = round(max(-6.0, min(9.0, novo_crescimento)), 2)

        # Atualiza PIB nominal
        taxa_mensal_pib = (self.crescimento_anual_pib / 12.0) / 100.0
        self.pib = round(self.pib * (1.0 + taxa_mensal_pib), 2)

        # 3. Curva de Phillips para Inflação (IPCA)
        # Inflação reage ao hiato do produto e arrefece com aperto monetário
        self.calcular_hiato_produto()
        pressao_demanda = self.hiato_produto * 0.22
        impacto_juros = -(aperto_monetario * 0.15)

        nova_inflacao = (
            (self.inflacao_ipca_12m * 0.86)
            + (self.meta_inflacao * 0.14)
            + pressao_demanda
            + impacto_juros
            + choque_inflacao
        )
        self.inflacao_ipca_12m = round(max(1.0, min(20.0, nova_inflacao)), 2)

        # 4. Desemprego (Lei de Okun)
        delta_desemprego = -(self.crescimento_anual_pib - self.crescimento_potencial) * 0.18
        self.taxa_desemprego = round(max(3.8, min(16.5, self.taxa_desemprego + delta_desemprego)), 1)

        # 5. Câmbio (USD/BRL): reage a juros locais vs fed funds (~4.75%) e risco fiscal
        diferencial_juros = self.taxa_juros_selic - 4.75
        efeito_juros_dolar = -(diferencial_juros * 0.035)
        efeito_risco_dolar = (self.divida_publica_pib - 75.0) * 0.018
        self.cambio_dolar = round(max(4.10, min(7.50, self.cambio_dolar + efeito_juros_dolar + efeito_risco_dolar)), 2)

        # 6. Contas Públicas & Dívida Pública
        self.arrecadacao_mes = round((self.pib * 0.32) / 12.0, 2)
        despesa_base = (self.pib * 0.322) / 12.0
        self.despesa_mes = round(despesa_base + (gasto_extra_gov / 12.0), 2)
        self.resultado_primario_mes = round(self.arrecadacao_mes - self.despesa_mes, 2)

        # Custo da dívida
        estoque_divida = (self.divida_publica_pib / 100.0) * self.pib
        juros_divida_mes = estoque_divida * ((self.taxa_juros_selic / 100.0) / 12.0)
        necessidade_financiamento = -self.resultado_primario_mes + juros_divida_mes
        novo_estoque = estoque_divida + necessidade_financiamento
        self.divida_publica_pib = round(max(50.0, min(130.0, (novo_estoque / self.pib) * 100.0)), 1)

        # Risco país e confiança
        self.risco_pais = max(80, int(150 + (self.divida_publica_pib - 70.0) * 8.0 + (self.inflacao_ipca_12m - self.meta_inflacao) * 14.0))
        self.confianca_empresarial = round(max(15.0, min(95.0, 50.0 + (self.crescimento_anual_pib * 4.0) - (self.inflacao_ipca_12m * 2.0))), 1)

        return {
            "ata_copom": ata_copom,
            "selic": self.taxa_juros_selic,
            "inflacao": self.inflacao_ipca_12m,
            "hiato": self.hiato_produto,
            "pib_crescimento": self.crescimento_anual_pib,
            "desemprego": self.taxa_desemprego,
            "dolar": self.cambio_dolar,
            "divida_pib": self.divida_publica_pib,
        }


@dataclass
class Governo:
    cargo_atual: CargoPoliticoId = CargoPoliticoId.CIDADAO
    esfera: EsferaGoverno = EsferaGoverno.NENHUMA
    partido: str = "Partido da Cidadania"
    meses_no_cargo: int = 0
    aprovacao_popular: float = 50.0  # 0 a 100
    apoio_parlamento: float = 40.0  # 0 a 100
    fundo_eleitoral: float = 5000.0
    propostas_aprovadas: List[str] = field(default_factory=list)

    def simular_mes(self, macro: Economia, meses_totais: int) -> List[str]:
        logs: List[str] = []
        if self.cargo_atual == CargoPoliticoId.CIDADAO:
            return logs

        self.meses_no_cargo += 1

        # Reação da aprovação popular à economia
        desvio_inflacao = macro.meta_inflacao - macro.inflacao_ipca_12m
        efeito_pib = macro.crescimento_anual_pib * 1.4
        efeito_emprego = (7.5 - macro.taxa_desemprego) * 1.1
        self.aprovacao_popular = max(10.0, min(95.0, self.aprovacao_popular * 0.92 + (50.0 + desvio_inflacao * 1.5 + efeito_pib + efeito_emprego) * 0.08))

        if self.meses_no_cargo % 48 == 0:
            logs.append(f"Fim de mandato de 4 anos como {self.cargo_atual.value.upper()}.")

        return logs


@dataclass
class SimulacaoCidadao:
    mes_atual: int = 1
    ano_atual: int = 2026
    meses_totais: int = 0
    vida: Vida = field(default_factory=Vida)
    empresa: Optional[Empresa] = None
    economia: Economia = field(default_factory=Economia)
    governo: Governo = field(default_factory=Governo)
    historico: List[Dict[str, Any]] = field(default_factory=list)

    def avancar_mes(self, choque_inflacao: float = 0.0, choque_pib: float = 0.0) -> Dict[str, Any]:
        self.meses_totais += 1
        self.mes_atual += 1
        if self.mes_atual > 12:
            self.mes_atual = 1
            self.ano_atual += 1

        logs_mes: List[str] = []

        # 1. Macroeconomia com Regra de Taylor
        res_macro = self.economia.simular_mes(choque_inflacao=choque_inflacao, choque_pib=choque_pib)
        logs_mes.append(res_macro["ata_copom"])

        # 2. Vida Pessoal
        salario_gov = 0.0
        if self.governo.cargo_atual == CargoPoliticoId.VEREADOR:
            salario_gov = 14000.0
        elif self.governo.cargo_atual == CargoPoliticoId.PREFEITO:
            salario_gov = 28000.0
        elif self.governo.cargo_atual == CargoPoliticoId.PRESIDENTE:
            salario_gov = 46000.0

        logs_vida = self.vida.simular_mes(self.economia.taxa_juros_selic, salario_politico=salario_gov)
        logs_mes.extend(logs_vida)

        # 3. Empresa (se houver)
        if self.empresa and self.empresa.ativa:
            logs_emp = self.empresa.simular_mes(
                self.economia.taxa_juros_selic,
                self.economia.inflacao_ipca_12m,
                self.economia.crescimento_anual_pib,
                self.economia.cambio_dolar,
            )
            logs_mes.extend(logs_emp)

        # 4. Governo
        logs_gov = self.governo.simular_mes(self.economia, self.meses_totais)
        logs_mes.extend(logs_gov)

        ponto = {
            "mes": self.mes_atual,
            "ano": self.ano_atual,
            "selic": self.economia.taxa_juros_selic,
            "inflacao": self.economia.inflacao_ipca_12m,
            "hiato": self.economia.hiato_produto,
            "pib_crescimento": self.economia.crescimento_anual_pib,
            "saldo_pessoal": round(self.vida.saldo_bancario, 2),
        }
        self.historico.append(ponto)

        return {"mes": self.mes_atual, "ano": self.ano_atual, "logs": logs_mes, "macro": res_macro}

    def pular_ano(self) -> List[Dict[str, Any]]:
        resultados = []
        for _ in range(12):
            resultados.append(self.avancar_mes())
        return resultados

    def salvar(self, caminho_arquivo: str) -> None:
        dados = {
            "mes_atual": self.mes_atual,
            "ano_atual": self.ano_atual,
            "meses_totais": self.meses_totais,
            "vida": asdict(self.vida),
            "empresa": asdict(self.empresa) if self.empresa else None,
            "economia": asdict(self.economia),
            "governo": asdict(self.governo),
            "historico": self.historico[-48:],
        }
        with open(caminho_arquivo, "w", encoding="utf-8") as f:
            json.dump(dados, f, indent=2, ensure_ascii=False)

    @classmethod
    def carregar(cls, caminho_arquivo: str) -> SimulacaoCidadao:
        with open(caminho_arquivo, "r", encoding="utf-8") as f:
            dados = json.load(f)

        vida_obj = Vida(**dados["vida"])
        empresa_obj = Empresa(**dados["empresa"]) if dados.get("empresa") else None
        
        # Filtra chaves válidas de Economia para compatibilidade
        econ_dict = dados["economia"]
        econ_valid_keys = {f.name for f in Economia.__dataclass_fields__.values()}
        filtered_econ = {k: v for k, v in econ_dict.items() if k in econ_valid_keys}
        economia_obj = Economia(**filtered_econ)

        gov_dict = dados["governo"]
        gov_valid_keys = {f.name for f in Governo.__dataclass_fields__.values()}
        filtered_gov = {k: v for k, v in gov_dict.items() if k in gov_valid_keys}
        governo_obj = Governo(**filtered_gov)

        sim = cls(
            mes_atual=dados["mes_atual"],
            ano_atual=dados["ano_atual"],
            meses_totais=dados["meses_totais"],
            vida=vida_obj,
            empresa=empresa_obj,
            economia=economia_obj,
            governo=governo_obj,
            historico=dados.get("historico", []),
        )
        return sim


if __name__ == "__main__":
    print("Iniciando teste do motor CIDADÃO e Regra de Taylor...")
    sim = SimulacaoCidadao()
    
    # Exibe valores iniciais
    print(f"Mês inicial: {sim.mes_atual}/{sim.ano_atual}")
    print(f"Selic inicial: {sim.economia.taxa_juros_selic:.2f}%, IPCA: {sim.economia.inflacao_ipca_12m:.2f}%, Meta: {sim.economia.meta_inflacao:.2f}%")
    
    # Cenário de alta da inflação para testar resposta da Regra de Taylor
    print("\n--- Aplicando Choque de Inflação de +2.0% ---")
    res1 = sim.avancar_mes(choque_inflacao=2.0)
    print("Ata Copom:", res1["macro"]["ata_copom"])
    print(f"Nova Selic: {sim.economia.taxa_juros_selic:.2f}% (Hiato: {sim.economia.hiato_produto:.2f}%)")
    
    assert sim.economia.taxa_juros_selic > 10.75, "Selic deveria ter subido com o choque de inflação!"
    print("Teste da Regra de Taylor passou com sucesso!")
