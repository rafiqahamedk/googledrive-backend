import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ActivateAccount = () => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { activateAccount } = useAuth();

  useEffect(() => {
    const activate = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid activation link');
        return;
      }

      try {
        const result = await activateAccount(token);
        
        if (result.success) {
          setStatus('success');
          setMessage(result.message);
          toast.success(result.message);
        } else {
          setStatus('error');
          setMessage(result.message);
          toast.error(result.message);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Account activation failed. Please try again.');
        toast.error('Account activation failed. Please try again.');
      }
    };

    activate();
  }, [token, activateAccount]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <div className="spinner w-6 h-6"></div>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Activating your account...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we activate your account.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Account Activated!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
            <div className="mt-8">
              <Link
                to="/login"
                className="btn btn-primary btn-lg"
              >
                Continue to Login
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Activation Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
            <div className="mt-8 space-y-4">
              <Link
                to="/register"
                className="btn btn-primary btn-lg w-full"
              >
                Create New Account
              </Link>
              <Link
                to="/login"
                className="btn btn-secondary btn-lg w-full"
              >
                Back to Login
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Activate Account - Google Drive Clone</title>
        <meta name="description" content="Activate your Google Drive Clone account" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default ActivateAccount;