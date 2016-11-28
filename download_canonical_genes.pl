#!/usr/bin/perl -w
use strict;

use Bio::EnsEMBL::Registry;

my $registry = 'Bio::EnsEMBL::Registry';

$registry->load_all();

$registry->load_registry_from_db(
    -host => 'useastdb.ensembl.org', # alternatively 'useastdb.ensembl.org'
    -user => 'anonymous'
);

my $gene_adaptor = $registry->get_adaptor('homo_sapiens','core','gene');
my $genes = $gene_adaptor->generic_fetch();

for my $gene (@{$genes}) {
    print $gene->stable_id() . "\t" . $gene->canonical_transcript()->stable_id() . "\n";
}
