"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TaskForm } from "@/components/tasks/task-form"

export default function NewTaskPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container flex items-center gap-4 py-4">
          <Link href="/tasks">
            <Button variant="ghost">← Back to Tasks</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New Task</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <section className="container py-8">
        <div className="max-w-2xl">
          <TaskForm />
        </div>
      </section>
    </main>
  )
}
