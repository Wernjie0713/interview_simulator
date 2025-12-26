import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Video, Mic, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "backOut",
      },
    },
    hover: {
      scale: 1.05,
      rotate: [0, -1, 1, -1, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "mirror",
      },
    },
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-20 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 max-w-4xl z-10"
        >
          <motion.div variants={itemVariants} className="flex justify-center">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium rounded-full gap-2 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3.5 w-3.5" /> Hackathon Prototype
            </Badge>
          </motion.div>

          <motion.div 
            variants={logoVariants}
            whileHover="hover"
            className="flex flex-col items-center justify-center gap-4"
          >
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img 
                src="/logo.png" 
                alt="EQ-View Logo" 
                className="relative h-32 w-32 md:h-40 md:w-40 object-contain drop-shadow-2xl" 
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              Master Your Interviews with <span className="text-primary">Emotional Intelligence</span>
            </h1>
            <p className="mx-auto max-w-[800px] text-muted-foreground text-lg md:text-2xl leading-relaxed">
              The multimodal AI interview simulator that analyzes your body language, micro-expressions, and speech patterns to give you the feedback of a human mentor.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-6 pt-8">
            <Button 
              size="xl" 
              onClick={() => navigate("/login")} 
              className="group relative overflow-hidden rounded-full px-10 h-14 text-lg font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Session <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <Button 
              size="xl" 
              variant="outline" 
              className="rounded-full px-10 h-14 text-lg font-semibold transition-all hover:bg-primary/5 hover:scale-105 active:scale-95"
            >
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative w-full py-24 bg-muted/30 border-y border-border/50">
        <div className="container px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: <Video className="h-10 w-10 text-primary" />,
                title: "Vision Analysis",
                desc: "Gemini 1.5 Flash analyzes your micro-expressions and body language frame-by-frame."
              },
              {
                icon: <Mic className="h-10 w-10 text-primary" />,
                title: "Voice Intelligence",
                desc: "Real-time speech-to-text and tone analysis to help you perfect your delivery and pace."
              },
              {
                icon: <BarChart3 className="h-10 w-10 text-primary" />,
                title: "Detailed Reports",
                desc: "Get timestamped feedback on exactly where you can improve your confidence and clarity."
              },
              {
                icon: <ShieldCheck className="h-10 w-10 text-primary" />,
                title: "Privacy First",
                desc: "Your data is secure and used only to help you improve. No recordings are stored without consent."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="h-full border-none bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="mb-4 p-3 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer / CTA Section */}
      <section className="py-24 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl space-y-8"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Ready to ace your next big interview?
          </h2>
          <Button 
            size="xl" 
            onClick={() => navigate("/login")} 
            className="rounded-full px-12 h-16 text-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
          >
            Get Started Now
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
