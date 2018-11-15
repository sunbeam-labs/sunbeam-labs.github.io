---
layout: default
---

Sunbeam is a bioinformatics analysis pipeline that supports
reproducible analysis of shotgun metagenomics data sets. Its main
feature is easy-to-make extensions, which allow users to specify
additional functionality for the pipeline with only a few lines of
code.

## Extensions

{% for item in site.data.repos %}
[{{ item.repo }}](https://github.com/{{ item.user }}/{{ item.repo }})

Targets: {{ item.target }}

  - Last update: {{ item.updated_at }}
  - Watchers: {{ item.watchers_count }}
  - Open issues: {{ item.open_issues }}

{% endfor %}