SHELL := /bin/bash
# Subset vcf/coverage data
FULL_DATA_FOLDER=/home/msolomon/data

EXOMES_VCF=exac2.vep.vcf.gz
EXOMES_COVERAGE_HEADER=exacv2.chr1.cov.txt.gz

GENOMES_AUTOSOMES_VCF_HEADER=autosomes/part-00000.bgz
GENOMES_X_VCF_HEADER=x/part-00000.bgz

# EXOMES_COVERAGE_HEADER=Panel.chr1.coverage.txt.gz

all: subsets

clean:
	rm -rf -- testdata

# .PHONY:  all

subsets: testdata/exomes/exac-subset.vcf.bgz.tbi \
	testdata/genomes/gnomad-subset.vcf.bgz.tbi
# testdata/exomes/coverage/exac-coverage-SLCA1.txt.gz.tbi \
# testdata/exomes/coverage/exac-coverage-PCSK9.txt.gz.tbi \
# testdata/exomes/coverage/exac-coverage-DMD.txt.gz.tbi


testdata:
	mkdir testdata testdata/exomes testdata/genomes testdata/exomes/coverage testdata/genomes/coverage

testdata/exomes/exac-subset.vcf.bgz: testdata
	tabix -h $(FULL_DATA_FOLDER)/exomes/$(EXOMES_VCF) 1:43391035-43424524 | bgzip > $@ #SLC2A1
	tabix $(FULL_DATA_FOLDER)/exomes/$(EXOMES_VCF) 1:55505224-55530515 | bgzip >> $@ #PCSK9
	tabix $(FULL_DATA_FOLDER)/exomes/$(EXOMES_VCF) X:31115727-33357555 | bgzip >> $@ #DMD
# zless testdata/exomes/exac-subset.vcf.bgz | grep -i DMD

testdata/exomes/exac-subset.vcf.bgz.tbi: testdata/exomes/exac-subset.vcf.bgz
	tabix $<

testdata/exomes/coverage/exac-coverage-SLCA1.txt.gz: testdata
	tabix -h $(FULL_DATA_FOLDER)/exomes/coverage/$(EXOMES_COVERAGE_HEADER) 1:43391035-43424524 | bgzip > $@ #SLC2A1
testdata/exomes/coverage/exac-coverage-SLCA1.txt.gz.tbi: testdata/exomes/coverage/exac-coverage-SLCA1.txt.gz
	tabix $<

testdata/exomes/coverage/exac-coverage-PCSK9.txt.gz: testdata
	tabix -h $(FULL_DATA_FOLDER)/exomes/coverage/$(EXOMES_COVERAGE_HEADER) 1:55505224-55530515 | bgzip >> $@ #PCSK9
testdata/exomes/coverage/exac-coverage-PCSK91.txt.gz.tbi: testdata/exomes/coverage/exac-coverage-PCSK9.txt.gz
	tabix $<

testdata/exomes/coverage/exac-coverage-DMD.txt.gz: testdata
	tabix -h $(FULL_DATA_FOLDER)/exomes/coverage/exacv2.chrX.cov.txt.gz X:31115727-33357555 | bgzip >> $@ #DMD
testdata/exomes/coverage/exac-coverage-DMD1.txt.gz.tbi: testdata/exomes/coverage/exac-coverage-DMD.txt.gz
	tabix $<

testdata/genomes/gnomad-subset.vcf.bgz: testdata
	tabix -h $(FULL_DATA_FOLDER)/genomes/$(GENOMES_AUTOSOMES_VCF_HEADER) | bgzip > $@ #SLC2A1
	for i in $(FULL_DATA_FOLDER)/genomes/autosomes/*gz; do tabix $$i  1:43391035-43424524 >> $@  ; done; #SLC2A1
	for i in $(FULL_DATA_FOLDER)/genomes/autosomes/*gz; do tabix $$i  1:55505224-55530515 >> $@  ; done; #PCSK9
	for i in $(FULL_DATA_FOLDER)/genomes/autosomes/*gz; do tabix $$i  X:31115727-33357555 >> $@  ; done; #DMD
# zless testdata/genomes/gnomad-subset.vcf.bgz | grep -i SLC2A1
# zless testdata/genomes/gnomad-subset.vcf.bgz | grep -i PCSK9
# zless testdata/genomes/gnomad-subset.vcf.bgz | grep -i DMD

testdata/genomes/gnomad-subset.vcf.bgz.tbi: testdata/genomes/gnomad-subset.vcf.bgz
	tabix $<