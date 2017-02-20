import jinja2
import os
#
# if len(sys.argv) != 2:
#   print("usage: {} [template-file]".format(sys.argv[0]), file=sys.stderr)
#   sys.exit(1)

template_file = '../templates/template-mongo-service.yaml'
template_path = os.path.join(os.path.dirname(__file__), template_file)

with open(template_path, "r") as f:
  print jinja2.Template(f.read()).render(name='gnomad',  port=27017)