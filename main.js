const sunbeam_targets = {
    FASTQC_SUMMARY: [
        "str(QC_FP/'reports'/'fastqc_quality.tsv')",
    ],
    DECONTAM_SUMMARY: [
        "str(QC_FP/'reports'/'preprocess_summary.tsv')",
    ],
    KRAKEN_SUMMARY: [
        "str(CLASSIFY_FP/'kraken'/'all_samples.tsv')",
    ],
    DECONTAM_FASTQ: [
        "str(QC_FP/'decontam'/'{sample}_{rp}.fastq.gz')",
        "str(QC_FP/'decontam'/'{sample}_1.fastq.gz')",
        "str(QC_FP/'decontam'/'{sample}_2.fastq.gz')",
        "str(QC_FP/'decontam'/'{sample}_R1.fastq.gz')",
        "str(QC_FP/'decontam'/'{sample}_R2.fastq.gz')"
    ],
    CONTIG_FASTA: [
        "str(ASSEMBLY_FP/'contigs'/'{sample}-contigs.fa')",
    ],
    PROTEIN_FASTA: [
        "str(ANNOTATION_FP/'genes'/'prodigal'/'{sample}_genes_prot.fa')",
    ]
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

const extensions_main = function () {
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
        const repo_card = $("<div/>");
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
                "<li>Last update: " + data.updated_at + "</li>",
                "<li>Watchers: " + data.watchers_count + "</li>",
                "<li>Open issues: " + data.open_issues_count + "</li>"
            );
            info_div.html(container);
        };

        const inject_targets = function ({data}) {
            const rules_container = $("<div/>");

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

    $.getJSON("extensions.json", function (repos) {
        return repos.forEach(process_repo);
    });
};
