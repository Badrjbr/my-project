import React, { useCallback, useState, useEffect } from "react";
import { PieChart, Pie, Sector} from "recharts";
import './PieChartComponent.css';
import axios from 'axios'

const renderActiveShape = (props) => {

    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
    //  percent,
      value
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#333"
        >{` ${value} `}</text>
        {/* <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#999"
        >
          {`(Rate ${(percent * 100).toFixed(2)}%)`}
        </text> */}
      </g>
    );
  };


function PieChartComponent(){
  const [activeIndex, setActiveIndex] = useState(0);
  

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, [setActiveIndex]);
  const [topProducts, setTopProducts] = useState([]);
  
  useEffect(() => {
    
    const fetchTopProducts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/v1/products/top5product"); 
        setTopProducts(response.data);
         console.log(response.data);
      } catch (error) {
        console.error("Error fetching top products:", error);
      }
    };
  
    fetchTopProducts();
  }, []);
  return (
    <PieChart width={500} height={500} className="piechartproduct"> 
   
    <Pie
      activeIndex={activeIndex}
      activeShape={renderActiveShape}
      data={topProducts}
      cx={250} 
      cy={250} 
      innerRadius={120}
      outerRadius={180} 
      fill="#8884d8"
      dataKey="value"
      onMouseEnter={onPieEnter}
    />
  </PieChart>
  );
};

export default PieChartComponent;