import collections
import json
import re

import subprocess
import sys

gnomad_genomes_vcf = "gs://gnomad-public/release/2.0.2/vcf/genomes/liftover_grch38/gnomad.genomes.r2.0.2.sites.chr22.liftover.b38.vcf.gz"
gnomad_exomes_vcf = "gs://gnomad-public/release/2.0.2/vcf/exomes/liftover_grch38/gnomad.exomes.r2.0.2.sites.liftover.b38.vcf.gz"
#gnomad_vcf = "gs://gnomad-public/release/2.0.2/vcf/genomes/gnomad.genomes.r2.0.2.sites.chr22.vcf.bgz"

def create_vcf_header_dict(vcf_gs_path):
    command = "gsutil cat %s | gunzip -c - | head -n 5000 | grep ^#" % vcf_gs_path
    print(command)
    header_string = subprocess.check_output(command, shell=True)

    results = collections.OrderedDict()
    for line in header_string.split("\n"):
        if not line.startswith("##INFO="):
            continue

        # example line: ##INFO=<ID=STAR_Hom,Number=1,Type=Integer,Description="Count of individuals homozygous for a deletion spanning this position">
        doc_fields = re.match(".+=<(.+?),(.+?),(.+?),(.+)>", line)
        if not doc_fields:
            sys.exit("ERROR: couldn't parse row: " + line)

        doc_fields_dict = collections.OrderedDict()

        for field in doc_fields.groups():
            match = re.match("(.+?)=(.*)", field)
            if not match:
                sys.exit("ERROR: couldn't parse row: " + line)

            doc_fields_dict[match.group(1)] = match.group(2).strip('"')

        results[doc_fields_dict['ID']] = doc_fields_dict
    return results

exomes_header = create_vcf_header_dict(gnomad_exomes_vcf)
genomes_header = create_vcf_header_dict(gnomad_genomes_vcf)

assert set(exomes_header.keys()).issuperset(set(genomes_header.keys()))

merged_header = collections.OrderedDict()
for key, exomes_dict in exomes_header.items():
    merged_header[key] = exomes_dict

    if key not in genomes_header:
        merged_header["exists_in"] = "exomes"
        print "NOTE: %s is in exomes but not in genomes" % key
        continue

    merged_header["exists_in"] = "exomes,genomes"

    # check whether the genomes header entry is different than in the exomes header
    genomes_dict = genomes_header[key]
    for k in ["ID", "Number", "Type", "Description"]:
        exomes_value = exomes_dict[k]
        genomes_value = genomes_dict[k]
        if exomes_value != genomes_value:
            print "WARNING: exomes header entry != genomes header entry for %s:" % key
            print "  exomes: " +  str(exomes_dict)
            print "  genomes: " + str(genomes_dict)



with open("gnomad_vcf_header.json", "w") as f:
    f.write(json.dumps(merged_header))
    f.write("\n")
