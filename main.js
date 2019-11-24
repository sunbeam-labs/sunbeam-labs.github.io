const sunbeam_extensions = [
    {"owner": "sunbeam-labs", "repo": "sbx_report"},
    {"owner": "sunbeam-labs", "repo": "sbx_coassembly"},
    {"owner": "sunbeam-labs", "repo": "sbx_metaphlan"},
    {"owner": "sunbeam-labs", "repo": "sbx_kaiju"},
    {"owner": "sunbeam-labs", "repo": "sbx_subsample"},
    {"owner": "sunbeam-labs", "repo": "sbx_anvio"},
    {"owner": "sunbeam-labs", "repo": "sbx_contigs"},
    {"owner": "sunbeam-labs", "repo": "sbx_spades"},
    {"owner": "sunbeam-labs", "repo": "sbx_shortbred"},
    {"owner": "sunbeam-labs", "repo": "sbx_gene_clusters"},
    {"owner": "sunbeam-labs", "repo": "sbx_krakenhll"},
    {"owner": "sunbeam-labs", "repo": "sbx_igv"},
    {"owner": "louiejtaylor", "repo": "sbx_rgi"},
    {"owner": "ArwaAbbas", "repo": "sbx_eggnog"},
    {"owner": "louiejtaylor", "repo": "sbx_mccann2018"},
    {"owner": "louiejtaylor", "repo": "sbx_bahram2018"},
    {"owner": "louiejtaylor", "repo": "sbx_lewis2015"},
    {"owner": "junglee0713", "repo": "sbx_shallowshotgun_pilot"},
    {"owner": "guanzhidao", "repo": "sbx_dedup"},
    {"owner": "ArwaAbbas", "repo": "sbx_select_contigs"},
];

const sunbeam_targets = {
    SEQUENCE_QUALITY_TABLE: [
        "str(QC_FP/'reports'/'fastqc_quality.tsv')",
    ],
    SAMPLE_ATTRITION_TABLE: [
        "str(QC_FP/'reports'/'preprocess_summary.tsv')",
    ],
    KRAKEN_ASSIGNMENTS_TABLE: [
        "str(CLASSIFY_FP/'kraken'/'all_samples.tsv')",
        "str(CLASSIFY_FP/'kraken'/'all_samples.biom')",
    ],
    QUALITY_CONTROLLED_FASTQ: [
        "str(QC_FP/'cleaned'/'{sample}_{rp}.fastq.gz')",
        "str(QC_FP/'cleaned'/'{{sample}}_{rp}.fastq.gz')",
        "str(QC_FP/'cleaned'/'{sample}_1.fastq.gz')",
        "str(QC_FP/'cleaned'/'{sample}_2.fastq.gz')",
    ],
    DECONTAMINATED_FASTQ: [
        "str(QC_FP/'decontam'/'{sample}_{rp}.fastq.gz')",
        "str(QC_FP/'decontam'/'{{sample}}_{rp}.fastq.gz')",
        "str(QC_FP/'decontam'/'{sample}_1.fastq.gz')",
        "str(QC_FP/'decontam'/'{sample}_2.fastq.gz')",
    ],
    CONTIG_FASTA: [
        "str(ASSEMBLY_FP/'contigs'/'{sample}-contigs.fa')",
    ],
    ORF_PROTEIN_FASTA: [
        "str(ANNOTATION_FP/'genes'/'prodigal'/'{sample}_genes_prot.fa')",
    ],
    ORF_NUCLEOTIDE_FASTA: [
        "str(ANNOTATION_FP/'genes'/'prodigal'/'{sample}_genes_nucl.fa')",
    ],
    MAPPING_BAM: [
        "str(MAPPING_FP/'{genome}'/'{sample}.bam')",
        "str(MAPPING_FP/'{{genome}}'/'{sample}.bam')",
    ],
    MAPPING_SAM: [
        "str(MAPPING_FP/'intermediates'/'{genome}'/'{sample}.sam')",
    ],
    CONTIG_ANNOTATIONS: [
        "str(ANNOTATION_FP/'summary'/'{sample}.tsv')",
    ],
};

const find_sunbeam_targets = function (rules_txt) {
    const targets = [];
    for (const key in sunbeam_targets) {
        const search_strs = sunbeam_targets[key];
        for (var i = 0; i < search_strs.length; i++) {
            search_str = search_strs[i];
            if (rules_txt.indexOf(search_str) !== -1) {
                targets.push(key);
                break;
            }
        }
    }
    return targets;
};

const is_rules_file = function (file_info) {
    return (
        file_info.name.match(/\.rules$/) &&
            (file_info.type === "file"));
};

// Takes the result of getContent, returns an array of targets in the file.
const get_rules_targets = function (file_info) {
    const rules_txt = window.atob(file_info.content);
    console.log(rules_txt);
    return find_sunbeam_targets(rules_txt);
};

const github_url = function ({owner, repo}) {
    return "https://github.com/" + owner + "/" + repo;
};

const featured_extensions_main = function () {
    inject_extensions(3);
}

const all_extensions_main = function () {
    inject_extensions(null);
}

const inject_extensions = function (n) {
    const octokit = new Octokit();

    const get_repo_files = function (repo_info) {
        repo_query = Object.assign({path: ""}, repo_info);
        return octokit.repos.getContent(repo_query);
    };

    const get_repo_file_contents = function (repo_info, file_info) {
        rules_query = Object.assign({path: file_info.path}, repo_info);
        return octokit.repos.getContent(rules_query);
    };

    const exts_list = $("#exts");

    const process_repo = function (repo_info) {
        const repo_card = $("<div/>", {
            class: "repo",
        });
        repo_card.appendTo(exts_list);

        const repo_header = $("<h3/>");
        const repo_link = $("<a/>", {
            href: github_url(repo_info),
            text: repo_info.repo,
        });
        repo_link.appendTo(repo_header);
        repo_header.appendTo(repo_card);

        const info_div = $("<div/>", {
            class: "repo-info",
            text: "Loading info...",
        });
        info_div.appendTo(repo_card);

        const rules_div = $("<div/>", {
            class: "repo-rules",
            text: "Finding rules..."
        });
        rules_div.appendTo(repo_card);
        
        const inject_info = function ({data}) {
            const container = $("<ul/>");
            const desc = data.description || "&nbsp;";
            container.append(
                "<li>Description: " + desc + "</li>",
                "<li>Last update: " + data.updated_at.substring(0, 10) + "</li>",
                "<li>Watchers: " + data.watchers_count + "</li>",
                "<li>Open issues: " + data.open_issues_count + "</li>"
            );
            info_div.html(container);
        };

        const inject_targets = function ({data}) {
            const rules_container = $("<div/>");

            rules_container.append("Sunbeam outputs used in ");
            const header = $("<em/>");
            header.text(data.path);
            rules_container.append(header);

            const rules_link = $("<a/>").attr("href", data.html_url);
            rules_link.text("Source");
            rules_container.append(" [", rules_link, "]");

            const targets = get_rules_targets(data);
            const target_list = $("<ol/>");
            targets.map((target) => {
                target_list.append("<li>" + target + "</li>");
            });
            if (targets.length == 0) {
                target_list.html("<em>None found.</em>");
            }
            rules_container.append(target_list);

            rules_container.appendTo(rules_div);
        };

        octokit.repos.get(repo_info).then(inject_info);

        get_repo_files(repo_info).then(function ({data}) {
            rules_div.html("");
            data.filter(is_rules_file).map((file_info) => {
                get_repo_file_contents(repo_info, file_info).then(inject_targets);
            });
        });
    };

    repos_to_inject = sunbeam_extensions;
    if (n !== null) {
        repos_to_inject = repos_to_inject.slice(0, n);
    }
    repos_to_inject.forEach(process_repo);
};
