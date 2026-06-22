import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/packages/ui-kit/components/ui/card";
import { Button } from "@/packages/ui-kit/components/ui/button";

export default function MFAPage() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Two-Factor Authentication</CardTitle>
        <CardDescription className="text-center">
          Please enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="code" className="text-sm font-medium leading-none">Authentication Code</label>
            <input 
              id="code" 
              name="code"
              type="text" 
              maxLength={6}
              placeholder="123456" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center tracking-widest ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required 
            />
          </div>
          <Button className="w-full" type="submit">
            Verify Code
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground text-center">
          Having trouble? Contact your administrator for a recovery code.
        </div>
      </CardFooter>
    </Card>
  );
}
