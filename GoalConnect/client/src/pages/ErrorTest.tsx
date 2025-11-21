import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Test page to verify ErrorBoundary is working
 * DO NOT DEPLOY TO PRODUCTION - For testing only
 */
export default function ErrorTest() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    // Intentionally throw error to test ErrorBoundary
    throw new Error('Test error: This is an intentional crash to test ErrorBoundary');
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl text-teal-400">Error Boundary Test</CardTitle>
          <CardDescription className="text-slate-300">
            This page tests the ErrorBoundary component
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300">
            Click the button below to trigger an intentional error. The ErrorBoundary should catch
            it and display a user-friendly error message instead of crashing the entire app.
          </p>

          <Button
            onClick={() => setShouldCrash(true)}
            variant="destructive"
            className="w-full"
          >
            Trigger Error (Test ErrorBoundary)
          </Button>

          <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700">
            <p className="text-sm font-semibold text-slate-300 mb-2">What should happen:</p>
            <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
              <li>Error is caught by ErrorBoundary</li>
              <li>User sees a friendly error message</li>
              <li>Rest of the app continues to work</li>
              <li>Error is logged to console</li>
              <li>User can try again or reload</li>
            </ul>
          </div>

          <div className="bg-amber-900/20 p-4 rounded-md border border-amber-700/50">
            <p className="text-sm font-semibold text-amber-400 mb-2">Warning:</p>
            <p className="text-sm text-amber-300">
              This is a test page. Do not deploy to production. Remove this route from App.tsx
              before deploying.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
