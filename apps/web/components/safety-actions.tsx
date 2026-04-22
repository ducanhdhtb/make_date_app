'use client';

import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Modal } from '@/components/modal';

type ReportType = 'user' | 'story' | 'message';

export function SafetyActions({
  targetUserId,
  targetUserName,
  reportTargetType = 'user',
  reportTargetId,
  onBlocked,
  onReported
}: {
  targetUserId: string;
  targetUserName: string;
  reportTargetType?: ReportType;
  reportTargetId?: string;
  onBlocked?: () => void;
  onReported?: () => void;
}) {
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('Không phù hợp');
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const titleSuffix = useMemo(() => ` ${targetUserName}`.trim(), [targetUserName]);

  const blockUser = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/blocks', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId,
          reason: blockReason.trim() || undefined
        })
      });
      setBlockOpen(false);
      onBlocked?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể chặn người dùng');
    } finally {
      setSubmitting(false);
    }
  };

  const reportUser = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify({
          reportedUserId: targetUserId,
          targetType: reportTargetType,
          targetId: reportTargetId || targetUserId,
          reason: reportReason.trim() || 'spam',
          details: reportDetails.trim() || undefined
        })
      });
      setReportOpen(false);
      setReportDetails('');
      onReported?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="btn btn-outline" type="button" onClick={() => setReportOpen(true)}>Báo cáo</button>
      <button className="btn btn-secondary" type="button" onClick={() => setBlockOpen(true)}>Chặn</button>

      <Modal
        open={reportOpen}
        title={`Báo cáo${titleSuffix ? `: ${titleSuffix}` : ''}`}
        onClose={() => !submitting && setReportOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setReportOpen(false)} disabled={submitting}>Hủy</button>
            <button className="btn btn-primary" type="button" onClick={reportUser} disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </>
        }
      >
        <div className="field">
          <label htmlFor="report-reason">Lý do</label>
          <select id="report-reason" className="select" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
            <option value="spam">Spam</option>
            <option value="harassment">Quấy rối</option>
            <option value="fake_profile">Hồ sơ giả</option>
            <option value="inappropriate_content">Nội dung không phù hợp</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="report-details">Mô tả thêm</label>
          <textarea id="report-details" className="textarea" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Thêm thông tin hỗ trợ xử lý báo cáo..." />
        </div>
      </Modal>

      <Modal
        open={blockOpen}
        title={`Chặn${titleSuffix ? `: ${titleSuffix}` : ''}`}
        onClose={() => !submitting && setBlockOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setBlockOpen(false)} disabled={submitting}>Hủy</button>
            <button className="btn btn-primary" type="button" onClick={blockUser} disabled={submitting}>
              {submitting ? 'Đang chặn...' : 'Xác nhận chặn'}
            </button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          Khi chặn, hai bên sẽ không thể tiếp tục nhắn tin hoặc nhìn thấy nhau trong các luồng phù hợp.
        </p>
        <div className="field">
          <label htmlFor="block-reason">Lý do chặn</label>
          <textarea id="block-reason" className="textarea" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Ví dụ: không phù hợp, quấy rối..." />
        </div>
      </Modal>
    </>
  );
}
