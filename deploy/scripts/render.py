import jinja2
import os
import stat
from os import listdir

template_folder_path = os.path.join(os.path.dirname(__file__), '../templates')
config_folder_path = os.path.join(os.path.dirname(__file__), '../config')
template_file_list = os.listdir(template_folder_path)

prod_config = {
  # gcloud config
  'GCLOUD_PROJECT': 'exac-gnomad',
  'GCLOUD_ZONE': 'us-east1-d',

  # infrastructure config
  'EXTERNAL_IP': '35.185.14.139',
  'REBUILD_IMAGES': 'none', # Which images to rebuild: none, all, specific?
  'RESTART_MONGO': 'false', # Restart mongo on every script launch?
  'MONGO_PORT': 27017,
  'MONITOR_LOADING': 'false', # Start server on the loading cluster rather than serving
  'SERVICE_ACCOUNT_KEY_FILE': 'exac-gnomad-30ea80400948.json',

  'LOADING_CLUSTER_NAME': 'gnomad-dev-cluster',
  'LOADING_CLUSTER': 'gke_exac-gnomad_us-east1-d_gnomad-dev-cluster',
  'LOADING_MACHINE_TYPE': 'n1-highmem-32',
  'LOAD_DB_PARALLEL_PROCESSES_NUMB': 32,

  'SERVING_CLUSTER_NAME': 'gnomad-dev-cluster',
  'SERVING_CLUSTER': 'gke_exac-gnomad_us-east1-d_gnomad-dev-cluster',
  'SERVER_MACHINE_TYPE': 'n1-standard-4',
  'SERVING_NODES': 1,
  'SERVING_AUTOSCALE_MINIMUM': 2,
  'SERVING_AUTOSCALE_MAXIMUM': 10,
  'SERVING_AUTOSCALE_MAXIMUM_CPU': 70,
  'READVIZ_VOLUME': 'gnomad-readviz-exons-vol',
  'READVIZ_DISK': 'gnomad-readviz-exons-gpd',

  # browser config
  'PROJECT_NAME': 'gnomad',
  'BROWSER_VERSION': '0.0.1-beta',
  'DEPLOYMENT_ENV': 'production',

  # data config
  'DATA_VERSION': '170219-release',
  'EXOMES_SINGLE_VCF': 'feb-2017-release/gnomad.exomes.sites.autosomes.vcf.bgz',
  'GENOMES_VCF_GLOB': 'feb-2017-release/*.bgz',
  'EXOMES_SINGLE_VCF_TEST': 'feb-2017-test/gnomad.exomes.sites.all.vcf.gz',
  'GENOMES_VCF_GLOB_TEST': 'feb-2017-test/*.bgz',
  'TABIX_BUCKET_PATH': 'gs://gnomad-browser/exomes/feb-2017-release'
}

development_config = {
  # gcloud config
  'GCLOUD_PROJECT': 'exac-gnomad',
  'GCLOUD_ZONE': 'us-east1-d',

  # infrastructure config
  'EXTERNAL_IP': '35.185.14.139',
  'REBUILD_IMAGES': 'none', # Which images to rebuild: none, all, specific?
  'MONITOR_LOADING': 'false', # Start server on the loading cluster rather than serving
  'SERVICE_ACCOUNT_KEY_FILE': 'exac-gnomad-30ea80400948.json',

  # loading
  'LOADING_CLUSTER_NAME': 'gnomad-dev-cluster',
  'LOADING_CLUSTER': 'gke_exac-gnomad_us-east1-d_gnomad-dev-cluster',
  'LOADING_MACHINE_TYPE': 'n1-highmem-32',
  'LOAD_DB_PARALLEL_PROCESSES_NUMB': "'32'",

  # serving
  'SERVING_CLUSTER_NAME': 'gnomad-dev-cluster',
  'SERVING_CLUSTER': 'gke_exac-gnomad_us-east1-d_gnomad-dev-cluster',
  'SERVER_MACHINE_TYPE': 'n1-standard-1',
  'SERVING_NODES': '1',
  'SERVING_AUTOSCALE_MINIMUM': '1',
  'SERVING_AUTOSCALE_MAXIMUM': '1',
  'SERVING_AUTOSCALE_MAXIMUM_CPU': '70',

  # readviz
  'READVIZ_VOLUME': 'gnomad-dev-readviz-exons-vol',
  'READVIZ_DISK': 'gnomad-readviz-exons-gpd-2',

  # mongo config
  'MONGO_VOLUME': 'gnomad-dev-mongo-persistent-storage',
  'MONGO_DISK': 'gnomad-mongo-disk-2',
  'MONGO_HOST': 'gnomad-d-mongo',
  'MONGO_PORT': 27017,
  'RESTART_MONGO': 'false', # Restart mongo on every script launch?

  # browser config
  'PROJECT_NAME': 'gnomad',
  'ENVIRONMENT_NAME': 'd',
  'BROWSER_VERSION': '0.0.1-beta',
  'DEPLOYMENT_ENV': 'production',
  # data config
  'DATA_VERSION': '170219-release',
  'EXOMES_SINGLE_VCF': 'feb-2017-release/gnomad.exomes.sites.autosomes.vcf.bgz',
  'GENOMES_VCF_GLOB': 'feb-2017-release/gnomad.genomes.sites.autosomes.vcf.bgz/*.bgz',
  'EXOMES_SINGLE_VCF_TEST': 'feb-2017-test/gnomad.exomes.sites.all.vcf.gz',
  'GENOMES_VCF_GLOB_TEST': 'feb-2017-test/*.bgz',

  # tabix
  'TABIX_BUCKET_PATH': 'gs://gnomad-browser/genomes/feb-2017-release/gnomad.genomes.sites.autosomes.vcf.bgz',
  'TABIX_VOLUME': 'gnomad-tabix-vol',
  'TABIX_DISK': 'gnomad-tabix-temp'
}

config = development_config

if config['ENVIRONMENT_NAME'] == '':
  config['PROJECT_ENVIRONMENT'] = config['PROJECT_NAME']
else:
  config['PROJECT_ENVIRONMENT'] = config['PROJECT_NAME'] + '-' + config['ENVIRONMENT_NAME']

# def ensure_dir(file_path):
#     if not os.path.exists(config_folder_path):
#         os.makedirs(directory)

print 'Cleaning previous files...'
for the_file in os.listdir(config_folder_path):
  file_path = os.path.join(config_folder_path, the_file)
  try:
    if os.path.isfile(file_path):
        os.unlink(file_path)
    #elif os.path.isdir(file_path): shutil.rmtree(file_path)
  except Exception as e:
    print(e)

print 'Parsing templates...'
for template_file_name in template_file_list:
  template_file_full_path = os.path.join(template_folder_path, template_file_name)
  with open(template_file_full_path, "r") as template:
    parsed = jinja2.Template(template.read()).render(config)
    if template_file_name == 'template-config.sh':
      configsh = os.path.join(config_folder_path, 'config.sh')
      with open(configsh, "wb") as fh:
        st = os.stat(configsh)
        os.chmod(configsh, st.st_mode | 0111)
        fh.write(parsed)
    else:
      parsed_file_path = os.path.join(config_folder_path, template_file_name.replace('template', config['PROJECT_ENVIRONMENT']))
      with open(parsed_file_path, "wb") as fh:
        fh.write(parsed)
#
