import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:contact@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get incomplete tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("completed", false)
      .gte("due_date", today.toISOString())
      .lt("due_date", tomorrow.toISOString());

    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ message: "No tasks due today" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subsError) throw subsError;

    const payload = JSON.stringify({
      title: "Klear Task Reminder",
      body: `You have ${tasks.length} task(s) to complete today! Let's get to work.`,
      url: "/tasks"
    });

    const notifications = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webpush.sendNotification(pushSubscription, payload).catch((err) => {
        console.error("Error sending push to", sub.endpoint, err);
        // Optional: you could delete invalid subscriptions here
      });
    });

    await Promise.all(notifications);

    return new Response(JSON.stringify({ message: "Reminders sent!" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
