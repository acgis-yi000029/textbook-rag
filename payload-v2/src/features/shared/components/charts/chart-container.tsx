/**
 * ChartContainer - Responsive chart wrapper with title, toolbar, and export support
 *
 * @module shared/components/charts
 * @template none
 * @reference none
 */
import { useRef } from 'react';
import { LineChart } from './line-chart';
import { BarChart } from './bar-chart';
import { PieChart, type PieChartDataItem } from './pie-chart';
import { ChartExport } from './chart-export';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/shared/components/ui/card';

/** ?????? */
export type ChartType = 'line' | 'bar' | 'pie';

/** ?????? */
export interface ChartData {
  /** ???? */
  type: ChartType;
  /** ???? */
  title?: string;
  /** X ????? */
  xKey?: string;
  /** Y ??????? */
  yKeys?: string[];
  /** ???? */
  data: Array<Record<string, unknown>> | PieChartDataItem[];
  /** ????(????) */
  stacked?: boolean;
}

/** ???? */
export interface SourceReference {
  document_id: string;
  document_name: string;
  page_number?: number;
}

export interface ChartContainerProps {
  /** ???? */
  chart: ChartData;
  /** ?????? */
  sources?: SourceReference[];
  /** ???????? */
  showExport?: boolean;
}

export function ChartContainer({
  chart,
  sources = [],
  showExport = true,
}: ChartContainerProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  // ??????
  const sourceText = sources.length > 0
    ? sources
        .map((s) =>
          s.page_number
            ? `${s.document_name} (p.${s.page_number})`
            : s.document_name
        )
        .join(', ')
    : undefined;

  const renderChart = () => {
    switch (chart.type) {
      case 'line':
        return (
          <LineChart
            data={chart.data as Array<Record<string, unknown>>}
            xKey={chart.xKey || 'x'}
            yKeys={chart.yKeys || ['value']}
            source={sourceText}
          />
        );
      case 'bar':
        return (
          <BarChart
            data={chart.data as Array<Record<string, unknown>>}
            xKey={chart.xKey || 'x'}
            yKeys={chart.yKeys || ['value']}
            source={sourceText}
            stacked={chart.stacked}
          />
        );
      case 'pie':
        return (
          <PieChart
            data={chart.data as PieChartDataItem[]}
            source={sourceText}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mt-4">
      {chart.title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{chart.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div ref={chartRef} className="bg-background p-4 rounded-lg">
          {renderChart()}
        </div>
        {showExport && (
          <ChartExport
            chartRef={chartRef}
            filename={`chart-${chart.type}-${Date.now()}`}
          />
        )}
      </CardContent>
    </Card>
  );
}
