import { useState, useRef, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadResume } from '@/api/resumes';
import { createCandidate } from '@/api/candidates';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';

export function UploadResumeModal({ isOpen, onClose }: UploadResumeModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [createdCandidateId, setCreatedCandidateId] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (selectedFile: File) => {
      setStatus('uploading');
      const tempCandidate = await createCandidate({
        fullName: selectedFile.name.replace(/\.[^/.]+$/, ''),
        email: '',
        skills: [],
      });
      setStatus('parsing');
      await uploadResume(selectedFile, tempCandidate._id);
      return tempCandidate;
    },
    onSuccess: (candidate) => {
      setCreatedCandidateId(candidate._id);
      setStatus('success');
      toast.success('Resume uploaded and parsed successfully');
    },
    onError: (err: Error) => {
      setStatus('error');
      toast.error(err.message || 'Failed to upload resume');
    },
  });

  const resetState = () => {
    setFile(null);
    setStatus('idle');
    setCreatedCandidateId(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload a PDF or DOCX file');
      return;
    }
    setFile(selectedFile);
    setStatus('idle');
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const handleViewCandidate = () => {
    if (createdCandidateId) {
      navigate(`/candidates/${createdCandidateId}`);
      handleClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Resume" size="md">
      <div className="space-y-4">
        {status === 'success' ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Resume Uploaded Successfully</h3>
            <p className="mt-1 text-sm text-gray-500">
              The resume has been uploaded and candidate data has been parsed.
            </p>
            {file && (
              <p className="mt-2 text-sm font-medium text-gray-700">{file.name}</p>
            )}
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleViewCandidate}>
                View Candidate
              </Button>
            </div>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <AlertCircle className="h-10 w-10" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Upload Failed</h3>
            <p className="mt-1 text-sm text-gray-500">
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : 'Something went wrong during upload'}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={resetState}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <div className={`rounded-full p-3 ${file ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                {file ? <FileText className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
              </div>
              {file ? (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    Drop your resume here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports PDF and DOCX files
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />
            </div>

            {file && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {status === 'uploading' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-gray-600">Uploading resume...</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-primary-500" />
                </div>
              </div>
            )}

            {status === 'parsing' && (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-gray-600">Parsing resume data...</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={status === 'uploading' || status === 'parsing'}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || status === 'uploading' || status === 'parsing'}
                isLoading={status === 'uploading' || status === 'parsing'}
              >
                <Upload className="h-4 w-4" />
                Upload Resume
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
