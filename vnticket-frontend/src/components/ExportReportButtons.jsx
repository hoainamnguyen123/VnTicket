import { useRef, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { exportEventBookings } from '../api/bookingExportApi';
import { downloadBlob } from '../utils/downloadFile';

const { Text } = Typography;

const ExportReportButtons = ({ eventId, eventName, isAdmin = false, align = 'end' }) => {
  const { t } = useTranslation();
  const inFlightRef = useRef(null);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');

  const handleExport = async (format) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = format;
    setDownloading(format);
    setError('');

    try {
      const blob = await exportEventBookings({ eventId, format, isAdmin });
      downloadBlob(blob, eventName, format);
    } catch {
      setError(t(
        'eventStats.exportError',
        'Không thể xuất báo cáo. Vui lòng thử lại.',
      ));
    } finally {
      inFlightRef.current = null;
      setDownloading(null);
    }
  };

  return (
    <Space orientation="vertical" align={align} size={4}>
      <Space wrap>
        <Button
          danger
          icon={<FilePdfOutlined />}
          loading={downloading === 'pdf'}
          disabled={Boolean(downloading && downloading !== 'pdf')}
          onClick={() => handleExport('pdf')}
        >
          {t('eventStats.exportPdf', 'Xuất PDF')}
        </Button>
        <Button
          type="primary"
          icon={<FileExcelOutlined />}
          loading={downloading === 'excel'}
          disabled={Boolean(downloading && downloading !== 'excel')}
          onClick={() => handleExport('excel')}
          style={{ background: '#217346' }}
        >
          {t('eventStats.exportExcel', 'Xuất Excel')}
        </Button>
      </Space>
      {error && (
        <Text type="danger" role="alert" aria-live="polite">
          {error}
        </Text>
      )}
    </Space>
  );
};

export default ExportReportButtons;
