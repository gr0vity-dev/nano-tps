
let chart;
let allData = {
    beta: [],
    prod: []
};

const blockTypeSelect = document.getElementById("blockType");
const environmentSelect = document.getElementById("environment");

const cpsTypes = ['cps_p50', 'cps_p75', 'cps_p90', 'cps_p99', 'cps_p100'];
const cpsColors = ['#FFA500', '#FFCC00', '#FFEB3B', '#00BCD4', '#2196F3'];

async function fetchData(env) {
    const response = await fetch(`/api/data/${env}`);
    const data = await response.json();
    allData[env] = data;
}

// function getData(blockType, env) {
//     const data = allData[env];
//     return cpsTypes.map(cps => {
//         return {
//             label: cps,
//             data: data[blockType].map(row => ({ x: row.date, y: row[cps] })),
//             borderColor: cpsColors[cpsTypes.indexOf(cps)],
//             backgroundColor: 'rgba(0, 0, 0, 0)'
//         };
//     });
// }

function parseDate(dateString) {
    const rowDateParts = dateString.split(/[- :]/); // Split the date string into parts
    const rowDate = new Date(
        `20${rowDateParts[0]}`,
        parseInt(rowDateParts[1]) - 1,
        rowDateParts[2],
        rowDateParts[3],
        rowDateParts[4]
    );
    return rowDate
}

function getData(blockType, env, timeFilter) {
    const data = allData[env];
    const filteredData = data[blockType].filter(row => {        
        const rowDate = parseDate(row.date)

        if (timeFilter === "all") {
            return true; // Include all data
        } else if (timeFilter === "6months") {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return rowDate >= sixMonthsAgo; // Include data within the last 6 months
        } else if (timeFilter === "3months") {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return rowDate >= threeMonthsAgo; // Include data within the last 3 months
        } else if (timeFilter === "1month") {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return rowDate >= oneMonthAgo; // Include data within the last 1 month
        }
    });

    return cpsTypes.map(cps => {
        return {
            label: cps,
            data: filteredData.map(row => ({ x: row.date, y: row[cps] })),
            borderColor: cpsColors[cpsTypes.indexOf(cps)],
            backgroundColor: 'rgba(0, 0, 0, 0)'
        };
    });
}






function drawChart() {
    const blockType = document.querySelector("#blockType .tab-option.selected").dataset.value;
    const env = document.querySelector("#environment .tab-option.selected").dataset.value;
    const timeFilter = document.querySelector("#timeFilter .tab-option.selected").dataset.value;
    
    //const dataSets = getData(blockType, env);
    const dataSets = getData(blockType, env, timeFilter);


    if (chart) {
        chart.destroy();
    }
    document.getElementById('spinner').style.display = 'none';

    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: dataSets
        },
        options: {
            animation: false,
            responsive: true,
            scales: {
                x: {
                    type: 'time', 
                    time: { parser: 'yyyy-MM-dd HH:mm', tooltipFormat: 'MMM d, yyyy HH:mm' }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff' // change to whatever color you prefer
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const lines = [];
                            
                            if (context.parsed.y !== null) {
                                lines.push(context.parsed.y.toFixed(2) + ' (' + context.dataset.label + ')');
                            }

                            if (context.parsed.x !== null) {
                                const timestamp = context.parsed.x;
                                const date = new Date(timestamp);
                                const formatter = new Intl.DateTimeFormat('de-DE', {year: 'numeric', month: '2-digit', day: '2-digit'});
                                lines.push('Date: ' + formatter.format(date));                                
                            }                            
                            
                            return lines;
                        }
                    }
                }
            }
        },
    });
}

Promise.all([fetchData('beta'), fetchData('prod')]).then(() => drawChart());

blockTypeSelect.addEventListener('change', () => {
    drawChart(blockTypeSelect.value, environmentSelect.value);
});

environmentSelect.addEventListener('change', () => {
    drawChart(blockTypeSelect.value, environmentSelect.value);
});

document.querySelectorAll('.tab-selector').forEach(selector => {
    selector.addEventListener('click', event => {
        if (!event.target.classList.contains('tab-option')) return;

        // Remove .selected from all options in this selector
        selector.querySelectorAll('.tab-option').forEach(option => option.classList.remove('selected'));

        // Add .selected to the clicked option
        event.target.classList.add('selected');

        // Refresh the chart with the new selection
        drawChart();
    });
});

window.onload = function() {
    document.getElementById('spinner').style.display = 'block';
    drawChart();
}
