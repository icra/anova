# anova (https://anova.icradev.cat)

status: en desenvolupament (early)

Plataforma web pensada per realitzar ràpidament tests ANOVA (anàlisi de la variança).

La idea sorgeix perquè sovint els investigadors tenen resultats experimentals
en aquest format:

```
observació nº, factor_1, factor_2, ..., factor_n, variable_interès_1, variable_interès_2, ..., variable_interès_m
```

on els factors són variables categòriques, i les variables d'interès són numèriques

Es vol determinar quins factors tenen més impacte en les variables de resposta.

<b>
  L'avantatge de tenir una interfície web és que permet modificar ràpidament
  els factors escollits i la variable de resposta escollida, així com excloure
  o incloure grups de factors ràpidament, i reexecutar l'ANOVA, així es pot
  tenir un retorn visual immediat.
</b>


## notes desenvolupament temporals
- 2-way ANOVA (és a dir: 1 variable i 2 factors) ja funciona

## dependències (veure carpeta /libs)
- VueJS (v3)
- jstat

## responsable
Lluís Bosch (lbosch@icra.cat)
