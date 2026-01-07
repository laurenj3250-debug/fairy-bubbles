# Component Patterns & Best Practices

## React + Tailwind + shadcn/ui Patterns

### Project Structure
```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components (Header, Footer, etc.)
│   └── features/        # Feature-specific components
├── lib/
│   └── utils.ts         # Utility functions
├── hooks/               # Custom React hooks
├── styles/
│   └── globals.css      # Global styles & Tailwind imports
└── app/ or pages/       # Next.js or routing
```

## Essential shadcn/ui Components

### Installation Pattern
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
```

### Button Variants
```tsx
import { Button } from "@/components/ui/button"

// Primary action
<Button>Click me</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost (minimal)
<Button variant="ghost">Skip</Button>

// Link style
<Button variant="link">Learn more</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Card Patterns
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form Pattern with Validation
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

function LoginForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Dialog (Modal) Pattern
```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Layout Patterns

### Hero Section
```tsx
<section className="relative py-20 lg:py-32">
  <div className="container mx-auto px-4">
    <div className="max-w-3xl">
      <h1 className="text-4xl lg:text-6xl font-bold mb-6">
        Compelling headline
      </h1>
      <p className="text-xl text-muted-foreground mb-8">
        Supporting description
      </p>
      <div className="flex gap-4">
        <Button size="lg">Primary CTA</Button>
        <Button size="lg" variant="outline">Secondary CTA</Button>
      </div>
    </div>
  </div>
</section>
```

### Bento Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card className="md:col-span-2 md:row-span-2">Large feature</Card>
  <Card>Small feature 1</Card>
  <Card>Small feature 2</Card>
  <Card className="md:col-span-2">Wide feature</Card>
  <Card>Small feature 3</Card>
</div>
```

### Navigation Header
```tsx
<header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
  <div className="container mx-auto px-4">
    <div className="flex h-16 items-center justify-between">
      <div className="flex items-center gap-8">
        <Logo />
        <nav className="hidden md:flex gap-6">
          <a href="#" className="text-sm font-medium hover:text-primary">Link</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost">Sign In</Button>
        <Button>Sign Up</Button>
      </div>
    </div>
  </div>
</header>
```

## State Management Patterns

### Local State (useState)
```tsx
const [count, setCount] = useState(0)
```

### Server State (React Query / TanStack Query)
```tsx
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})
```

### Global State (Zustand)
```tsx
import { create } from 'zustand'

const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}))
```

## Animation Patterns

### Framer Motion
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Tailwind CSS Animations
```tsx
<div className="transition-all duration-300 hover:scale-105">
  Hover me
</div>
```

## Performance Patterns

### Code Splitting
```tsx
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### Image Optimization (Next.js)
```tsx
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority
/>
```

## Dark Mode Pattern
```tsx
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      Toggle theme
    </Button>
  )
}
```
