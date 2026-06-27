import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useAuth } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Mail, Lock, User, ArrowRight, UserPlus } from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function CandidateRegisterPage() {
  const navigate = useNavigate();
  const { registerCandidate } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      await registerCandidate({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success('Account created successfully!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      let message = 'Registration failed. Please try again.';
      if (err instanceof AxiosError) {
        message =
          err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          err.message ||
          message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-gray-800 bg-gray-900/80 shadow-2xl backdrop-blur-xl">
        <CardBody className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Join as a Job Seeker</h1>
            <p className="mt-1 text-sm text-gray-400">
              Create an account to apply for jobs and track your applications
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              icon={<User className="h-4 w-4" />}
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@email.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              icon={<Lock className="h-4 w-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full"
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-400 hover:text-primary-300"
            >
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-gray-500">
            Are you an employer?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-400 hover:text-primary-300"
            >
              Register your company
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
