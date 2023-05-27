#!./venv_py/bin/python
from flask import Flask, render_template, Blueprint, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import pandas as pd

app = Flask(__name__)
api = Blueprint('api', __name__)
limiter = Limiter(key_func=get_remote_address,
                  default_limits=["2000 per day", "500 per hour"],
                  storage_uri="redis://redis")
limiter.init_app(app)

DATA_FILES = ['send', 'receive', 'change']

@app.route('/')
def home():
    return render_template('v2.html')

@api.route('/data/<env>')
@limiter.limit("50/minute")
def get_data(env):
    if env not in ['prod', 'beta']:
        env = 'beta'

    data = {}
    columns_to_drop = ['ws_url']

    for file in DATA_FILES:
        df = pd.read_csv(f"data/{file}_{env}.csv")
        for column in columns_to_drop:
            if column in df.columns:
                df = df.drop(column, axis=1)
        data[file] = df.to_dict('records')
    return jsonify(data)

app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
    app.run(host='0.0.0.0')
