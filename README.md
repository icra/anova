# anova (https://anova.icradev.cat)

status: en desenvolupament (early)

Plataforma web pensada per realitzar ràpidament tests ANOVA (anàlisi de la variança).

La idea sorgeix perquè sovint els investigadors tenen resultats experimentals
en aquest format:

```
observació nº, factor_1, factor_2, ..., factor_n, variable_interès_1, variable_interès_2, ..., variable_interès_m
```

on els factors són variables categòriques, i les variables d'interès són numèriques

Sovint es vol determinar quins factors tenen més impacte en les variables de resposta.

Es vol implementar tant univariant (multiway ANOVA, és a dir varis factors) com
multivariant (MANOVA, vàries variables d'interès).

## notes desenvolupament temporals
- 2-way ANOVA (és a dir: 1 variable i 2 factors) ja funciona

## responsable
Lluís Bosch (lbosch@icra.cat)
