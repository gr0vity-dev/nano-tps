from flask import Flask, render_template
import pandas as pd
import json
import plotly
import plotly.express as px
from plotly.colors import *

pl_colors = cmocean.deep

app = Flask(__name__)

@app.route('/')
def home():
   return render_template('index.html')

@app.route('/prod')
def prod():
   pd.options.plotting.backend = "plotly"
   df = pd.read_csv("send_prod.csv")
   fig = px.line(df, x = 'date', y=['cps_50%', 'cps_75%', 'cps_90%', 'cps_100%'], title='PROD SEND blocks tps (at 50%, 75% 90% and 100% confirmed blocks)')
   # fig.data[0].line.color = "#8bbdd9"
   # fig.data[1].line.color = "#5ba4cf"
   # fig.data[2].line.color = "#026aa7"
   # fig.data[3].line.color = "#0c3953"
   fig.data[0].line.color = "#FAA943"
   fig.data[1].line.color = "#EC6816"
   fig.data[2].line.color = "#871C0E"
   fig.data[3].line.color = "#472F05"

   df2 = pd.read_csv("receive_prod.csv")
   fig2 = px.line(df2, x = 'date', y=['cps_50%', 'cps_75%', 'cps_90%', 'cps_100%'], title='PROD RECEIVE blocks tps (at 50%, 75% 90% and 100% confirmed blocks)')
   fig2.data[0].line.color = "#FAA943"
   fig2.data[1].line.color = "#EC6816"
   fig2.data[2].line.color = "#871C0E"
   fig2.data[3].line.color = "#472F05"

   df3 = pd.read_csv("change_prod.csv")
   fig3 = px.line(df3, x = 'date', y=['cps_50%', 'cps_75%', 'cps_90%', 'cps_100%'], title='PROD CHANGE blocks tps (at 50%, 75% 90% and 100% confirmed blocks)')
   fig3.data[0].line.color = "#FAA943"
   fig3.data[1].line.color = "#EC6816"
   fig3.data[2].line.color = "#871C0E"
   fig3.data[3].line.color = "#472F05"

   graphs = [fig, fig2, fig3]

   graphJSON = json.dumps(graphs, cls=plotly.utils.PlotlyJSONEncoder)
   return render_template('prod.html', graphJSON=graphJSON)

@app.route('/beta')
def beta():
   pd.options.plotting.backend = "plotly"
   df = pd.read_csv("send_beta.csv")
   fig = px.line(df, x = 'date', y=['cps_p50', 'cps_p75', 'cps_p90', 'cps_p100'], title='BETA SEND blocks tps (at 50%, 75% 90% and 100% confirmed blocks)')
   # fig.data[0].line.color = "#8bbdd9"
   # fig.data[1].line.color = "#5ba4cf"
   # fig.data[2].line.color = "#026aa7"
   # fig.data[3].line.color = "#0c3953"
   fig.data[0].line.color = "#FAA943"
   fig.data[1].line.color = "#EC6816"
   fig.data[2].line.color = "#871C0E"
   fig.data[3].line.color = "#472F05"

   df2 = pd.read_csv("receive_beta.csv")
   fig2 = px.line(df2, x = 'date', y=['cps_p50', 'cps_p75', 'cps_p90', 'cps_p100'], title='BETA RECEIVE blocks tps (at 50%, 75% 90% and 100% confirmed blocks)')
   fig2.data[0].line.color = "#FAA943"
   fig2.data[1].line.color = "#EC6816"
   fig2.data[2].line.color = "#871C0E"
   fig2.data[3].line.color = "#472F05"

   df3 = pd.read_csv("change_beta.csv")
   fig3 = px.line(df3, x = 'date', y=['cps_p50', 'cps_p75', 'cps_p90', 'cps_p100'], title='BETA CHANGE blocks tps (at 50%, 75% 90% and 100% confirmed blocks)')
   fig3.data[0].line.color = "#FAA943"
   fig3.data[1].line.color = "#EC6816"
   fig3.data[2].line.color = "#871C0E"
   fig3.data[3].line.color = "#472F05"

   graphs = [fig, fig2, fig3]

   graphJSON = json.dumps(graphs, cls=plotly.utils.PlotlyJSONEncoder)
   return render_template('beta.html', graphJSON=graphJSON)

if __name__ == '__main__':
	app.run()