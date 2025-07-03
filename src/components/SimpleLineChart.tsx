import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';

interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

interface SimpleLineChartProps {
  data: ChartData;
  width: number;
  height: number;
  chartConfig: {
    backgroundColor: string;
    backgroundGradientFrom: string;
    backgroundGradientTo: string;
    color: (opacity?: number) => string;
    labelColor: (opacity?: number) => string;
    style?: any;
    propsForDots?: any;
  };
  bezier?: boolean;
  withHorizontalLabels?: boolean;
  withVerticalLabels?: boolean;
  withHorizontalLines?: boolean;
  withVerticalLines?: boolean;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  width,
  height,
  chartConfig,
  withHorizontalLabels = true,
  withVerticalLabels = true,
}) => {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (!data?.datasets?.[0]?.data?.length) {
    return (
      <View style={[styles.container, { width, height, backgroundColor: chartConfig.backgroundColor }]}>
        <Text style={[styles.noDataText, { color: chartConfig.labelColor() }]}>
          No data available
        </Text>
      </View>
    );
  }

  const values = data.datasets[0].data;
  const labels = data.labels;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Calculate points for the line
  const points = values.map((value, index) => {
    const x = padding + (index * chartWidth) / (values.length - 1);
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={[styles.container, { width, height, backgroundColor: chartConfig.backgroundColor }]}>
      <Svg width={width} height={height}>
        {/* Main line */}
        <Polyline
          points={points}
          fill="none"
          stroke={chartConfig.color()}
          strokeWidth="2"
        />
        
        {/* Data points */}
        {values.map((value, index) => {
          const x = padding + (index * chartWidth) / (values.length - 1);
          const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
          return (
            <React.Fragment key={index}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill={chartConfig.color()}
                stroke={chartConfig.backgroundColor}
                strokeWidth="2"
              />
            </React.Fragment>
          );
        })}

        {/* Horizontal labels */}
        {withHorizontalLabels && labels.map((label, index) => {
          const x = padding + (index * chartWidth) / (labels.length - 1);
          return (
            <SvgText
              key={index}
              x={x}
              y={height - 10}
              fill={chartConfig.labelColor()}
              fontSize="12"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}

        {/* Vertical labels */}
        {withVerticalLabels && [minValue, maxValue].map((value, index) => {
          const y = padding + (index === 0 ? chartHeight : 0);
          return (
            <SvgText
              key={index}
              x={15}
              y={y + 5}
              fill={chartConfig.labelColor()}
              fontSize="12"
              textAnchor="middle"
            >
              {value.toFixed(1)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    flex: 1,
    textAlignVertical: 'center',
  },
}); 