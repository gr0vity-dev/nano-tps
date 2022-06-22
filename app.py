from flask import Flask, render_template
import pandas as pd
import json
import plotly
import plotly.express as px

app = Flask(__name__)
@app.route('/')
def notdash():
   df = pd.read_csv("fridge.csv")
   fig = px.line(df, title='Power samples of a fridge from the REDD dataset')

   graphJSON = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)
   return render_template('home.html', graphJSON=graphJSON)

if __name__ == '__main__':
	app.run()