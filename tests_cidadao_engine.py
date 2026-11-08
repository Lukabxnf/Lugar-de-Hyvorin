import os
import unittest
from cidadao_engine import Economia, SimulacaoCidadao, CargoPoliticoId


class TestRegraTaylor(unittest.TestCase):
    def test_reacao_choque_inflacao(self):
        econ = Economia(
            taxa_juros_selic=10.75,
            inflacao_ipca_12m=4.10,
            meta_inflacao=3.50,
            crescimento_anual_pib=2.30,
        )
        selic_inicial = econ.taxa_juros_selic
        # Simula mês com choque de inflação de +2.0%
        res = econ.simular_mes(choque_inflacao=2.0)
        self.assertGreater(econ.taxa_juros_selic, selic_inicial)
        self.assertIn("Elevação", res["ata_copom"])

    def test_reacao_recessao_e_deflacao(self):
        econ = Economia(
            taxa_juros_selic=12.0,
            inflacao_ipca_12m=2.5,  # Abaixo da meta de 3.5%
            meta_inflacao=3.5,
            crescimento_anual_pib=-1.5,  # Hiato negativo profundo
        )
        res = econ.simular_mes()
        self.assertLess(econ.taxa_juros_selic, 12.0)
        self.assertIn("Redução", res["ata_copom"])

    def test_formula_alvo_taylor(self):
        econ = Economia(
            taxa_neutra_real=5.0,
            meta_inflacao=3.5,
            alpha_inflacao=1.5,
            beta_hiato=0.5,
            inflacao_ipca_12m=5.5,  # desvio = +2.0
            crescimento_anual_pib=3.0,  # potencial = 2.0 -> hiato = +1.0
        )
        # i* = 5.0 + 3.5 + 1.5 * 2.0 + 0.5 * 1.0 = 8.5 + 3.0 + 0.5 = 12.0%
        alvo = econ.calcular_taxa_selic_alvo_taylor()
        self.assertAlmostEqual(alvo, 12.0, places=1)

    def test_salvar_e_carregar(self):
        sim = SimulacaoCidadao()
        sim.avancar_mes(choque_inflacao=1.0)
        caminho = "/tmp/teste_save_cidadao.json"
        sim.salvar(caminho)
        self.assertTrue(os.path.exists(caminho))

        carregado = SimulacaoCidadao.carregar(caminho)
        self.assertEqual(carregado.mes_atual, sim.mes_atual)
        self.assertEqual(carregado.ano_atual, sim.ano_atual)
        self.assertAlmostEqual(carregado.economia.taxa_juros_selic, sim.economia.taxa_juros_selic, places=2)
        os.remove(caminho)


if __name__ == "__main__":
    unittest.main()
