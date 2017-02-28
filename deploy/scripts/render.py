import jinja2
import os
import stat
from os import listdir

template_folder_path = os.path.join(os.path.dirname(__file__), '../templates')
config_folder_path = os.path.join(os.path.dirname(__file__), '../config')
template_file_list = os.listdir(template_folder_path)

project_config = {
  # browser config
  'PROJECT_NAME': 'gnomad',
  'BROWSER_VERSION': '1.0.6',
  'DATA_VERSION': '2.0.1',
  'DEPLOYMENT_ENV': 'development',
}
#
options = {
  'REBUILD_IMAGES': 'specific', # Which images to rebuild: none, all, specific?
  'RESTART_MONGO': 'true', # Restart mongo on every script launch?
  'MONITOR_LOADING': 'false', # Start server on the loading cluster rather than serving
}

loading_config = {
  'LOADING_CLUSTER_NAME': 'gnomad-loading-cluster',
  'LOADING_CLUSTER': 'gke_exac-gnomad_us-east1-d_gnomad-loading-cluster',
  'LOADING_MACHINE_TYPE': 'n1-highmem-32',
  'LOAD_DB_PARALLEL_PROCESSES_NUMB': "'32'",

  'EXOMES_SINGLE_VCF': '170228-release/gnomad.exomes.sites.vcf.bgz',
  # 'EXOMES_SINGLE_VCF': '170228-release/gnomad.exomes.sites.vcf.bgz',
  'GENOMES_VCF_GLOB': '170228-release/gnomad.genomes.sites.X.vcf.bgz/*.bgz',
  # 'GENOMES_VCF_GLOB': '170228-release/gnomad.genomes.sites.autosomes.vds.autosomes.vcf.bgz/*.bgz',
  # 'GENOMES_VCF_GLOB': 'feb-2017-release/*.bgz',
  # 'GENOMES_VCF_GLOB': 'feb-2017-release/gnomad.genomes.sites.X.vcf.bgz',
  # 'GENOMES_VCF_GLOB': 'feb-2017-testfilters/*.bgz',
  'EXOMES_SINGLE_VCF_TEST': 'feb-2017-test/gnomad.exomes.sites.all.vcf.gz',
  # 'EXOMES_SINGLE_VCF_TEST': 'feb-2017-test/gnomad.exomes.sites.all.vcf.gz',
  'GENOMES_VCF_GLOB_TEST': 'feb-2017-testfilters/*.bgz',
#
  # 'TABIX_BUCKET_PATH': 'gs://gnomad-browser/genomes/170228-release/*.bgz',
  'TABIX_BUCKET_PATH': 'gs://gnomad-browser/genomes/170228-distribution',
  'TABIX_VOLUME': 'gnomad-tabix-vol',
  'TABIX_DISK': 'gnomad-tabix-temp'
}
#
production_config = {
  'ENVIRONMENT_NAME': 'p', # p for production

  # gcloud config
  'GCLOUD_PROJECT': 'exac-gnomad',
  'GCLOUD_ZONE': 'us-east1-d',
  'EXTERNAL_IP': '104.196.31.30',
  'SERVICE_ACCOUNT_KEY_FILE': 'exac-gnomad-30ea80400948.json',

  # serving
  'SERVING_CLUSTER_NAME': 'gnomad-serving-cluster',
  'SERVING_CLUSTER': 'gke_exac-gnomad_us-east1-d_gnomad-serving-cluster',
  'SERVER_MACHINE_TYPE': 'n1-highmem-8',
  'SERVING_NODES': '3',
  'SERVER_REPLICAS': '10',
  'SERVING_AUTOSCALE_MINIMUM': '10',
  'SERVING_AUTOSCALE_MAXIMUM': '20',
  'SERVING_AUTOSCALE_MAXIMUM_CPU': '70',

  # readviz
  'READVIZ_VOLUME': 'gnomad-dev-readviz-exons-vol-2',
  'READVIZ_DISK': 'gnomad-readviz-exons-gpd-2',

  # mongo
  'MONGO_VOLUME': 'gnomad-mongo-persistent-storage-3',
  'MONGO_DISK': 'gnomad-mongo-disk-3',
  'MONGO_HOST': 'gnomad-p-mongo',
  'MONGO_PORT': 27017,
}

development_config = {
  'ENVIRONMENT_NAME': 'd', # d for development

  # gcloud config
  'GCLOUD_PROJECT': 'exac-gnomad',
  'GCLOUD_ZONE': 'us-east1-d',

  # infrastructure config
  'EXTERNAL_IP': '104.196.46.19',
  'SERVICE_ACCOUNT_KEY_FILE': 'exac-gnomad-30ea80400948.json',

  # serving
  'SERVING_CLUSTER_NAME': 'gnomad-dev-cluster',
  'SERVING_CLUSTER': 'gke_exac-gnomad_us-east1-d_gnomad-dev-cluster',
  'SERVER_MACHINE_TYPE': 'n1-standard-1',
  'SERVING_NODES': '1',
  'SERVER_REPLICAS': '1',
  'SERVING_AUTOSCALE_MINIMUM': '1',
  'SERVING_AUTOSCALE_MAXIMUM': '1',
  'SERVING_AUTOSCALE_MAXIMUM_CPU': '70',

  # readviz
  'READVIZ_VOLUME': 'gnomad-d-readviz-exons-vol-1',
  # 'READVIZ_VOLUME': 'gnomad-dev-readviz-exons-vol-3',
  'READVIZ_DISK': 'gnomad-readviz-exons-gpd',
  # 'READVIZ_DISK': 'gnomad-readviz-exons-gpd-3',

  # mongo config
  'MONGO_VOLUME': 'gnomad-mongo-persistent-storage-2',
  # 'MONGO_VOLUME': 'gnomad-mongo-persistent-storage-2',
  'MONGO_DISK': 'gnomad-mongo-disk-2',
  # 'MONGO_DISK': 'gnomad-mongo-disk-2',

  'MONGO_HOST': 'gnomad-d-mongo',
  'MONGO_PORT': 27017,
}

if production_config['READVIZ_DISK'] == development_config['READVIZ_DISK']:
  raise StandardError

if production_config['MONGO_DISK'] == development_config['MONGO_DISK']:
  raise StandardError

config = project_config.copy()
config.update(options)
config.update(loading_config)

if config['DEPLOYMENT_ENV'] == 'production':
  config.update(production_config)
if config['DEPLOYMENT_ENV'] == 'development':
  config.update(development_config)

if config['ENVIRONMENT_NAME'] == '':
  config['PROJECT_ENVIRONMENT'] = config['PROJECT_NAME']
else:
  config['PROJECT_ENVIRONMENT'] = config['PROJECT_NAME'] + '-' + config['ENVIRONMENT_NAME']

def ensure_dir(file_path):
  if not os.path.exists(config_folder_path):
    os.makedirs(directory)


def clean():
  print 'Cleaning previous files...'
  for the_file in os.listdir(config_folder_path):
    file_path = os.path.join(config_folder_path, the_file)
    try:
      if os.path.isfile(file_path):
          os.unlink(file_path)
      #elif os.path.isdir(file_path): shutil.rmtree(file_path)
    except Exception as e:
      print(e)

def parse_templates():
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

clean()
parse_templates()
