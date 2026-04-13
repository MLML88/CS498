import React from 'react'
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts' 

//Define the shape of the data
interface DataEntry {
    name: string
    numValue: number
    strValue: string
}

// Interface for props
interface PieChartProps {
    data: DataEntry[]
}

// Define the custom colors for the pie slices
const COLORS = ['#0088FE', '#00C49A', '#FFBB28', '#FF8042', '#ff42ec', '#42cdff', '#ff4248', '#97ff42']

// Define custome tooltip for pie slices
const CustomTooltip = ({ active, payload }: any) => {
    console.log("Payload: ", payload)
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="custome-tooltip">
                <p className="label">
                    {data.name} - {data.strValue}
                </p>
            </div>
        )
    }
}

const PieChartWithKey: React.FC<PieChartProps> = ({ data }) => {
    console.log("data: ", data)
    return (
        // ResponsiveContainer ensures the chart adjjusts to its parent's size
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="100%"
                    fill='#8884d8'
                    dataKey="numValue"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <label htmlFor=""></label>
                </Pie>
                {/* Tooltip fo interactivity */}
                <Tooltip content={<CustomTooltip/>}/>
                {/* Legend component to display the key */}
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
            </PieChart>
        </ResponsiveContainer>
    )
}

export default PieChartWithKey