"use client";

import { useState, useActionState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/packages/ui-kit/components/ui/button";
import { Input } from "@/packages/ui-kit/components/ui/input";
import { createClient } from "@/lib/supabase/client";

import { signUp } from "../actions";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 font-medium" type="submit" disabled={pending}>
      {pending ? "Creating Workspace..." : "Create account"}
      {!pending && <ArrowRight className="ml-2 w-4 h-4" />}
    </Button>
  );
}

const BRANDS = [
  { name: "Google", src: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { name: "Amazon", src: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
  { name: "Microsoft", src: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
  { name: "Netflix", src: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
  { name: "Spotify", src: "https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg" }
];

function DynamicCompanies() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % BRANDS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center pt-10 w-full max-w-[400px] mx-auto opacity-70">
      <div className="text-xs text-muted-foreground mb-6 font-medium tracking-wide uppercase">
        Trusted by modern teams
      </div>
      <div className="h-8 relative w-full flex justify-center items-center">
        {BRANDS.map((brand, i) => (
          <img
            key={brand.name}
            src={brand.src}
            alt={brand.name}
            className={`absolute h-6 object-contain grayscale dark:invert transition-all duration-500 ease-in-out ${
              i === index 
                ? "opacity-100 transform translate-y-0" 
                : "opacity-0 transform translate-y-4"
            }`}
            style={{ display: i === index ? 'block' : 'none' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signUp, null);
  const [showEmail, setShowEmail] = useState(false);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-[400px] bg-gray-50 dark:bg-zinc-900/50 sm:p-8 sm:border sm:border-gray-200 dark:sm:border-white/10 sm:rounded-xl sm:shadow-sm space-y-6">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Create an account
          </h1>
        </div>

        <div className="grid gap-4">
          <Button 
            variant="outline" 
            className="w-full bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-transparent dark:text-gray-200 dark:border-white/20 dark:hover:bg-white/5 h-11" 
            type="button" 
            onClick={handleGoogleSignIn}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </Button>
          
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#0B0E14] px-4 text-gray-500 dark:text-gray-400">
                Or
              </span>
            </div>
          </div>

          {!showEmail ? (
            <Button 
              type="button"
              variant="secondary" 
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 h-11" 
              onClick={() => setShowEmail(true)}
            >
              Continue with Email
            </Button>
          ) : (
            <form action={formAction} className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {state?.error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-md flex items-center gap-2 border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{state.error}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="first-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
                  <Input 
                    id="first-name" 
                    name="firstName"
                    placeholder="John" 
                    className="h-11 bg-white dark:bg-black/50"
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="last-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
                  <Input 
                    id="last-name" 
                    name="lastName"
                    placeholder="Doe" 
                    className="h-11 bg-white dark:bg-black/50"
                    required 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="name@company.com" 
                  className="h-11 bg-white dark:bg-black/50"
                  required 
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  className="h-11 bg-white dark:bg-black/50"
                  required 
                />
              </div>
              <SubmitButton />
            </form>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 text-center text-xs text-gray-400 dark:text-gray-500">
          By joining, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</Link>.
        </div>
      </div>

      <DynamicCompanies />
    </div>
  );
}
