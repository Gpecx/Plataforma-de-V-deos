"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Infinity, Award, Headphones, TrendingUp, Handshake, BarChart3, Loader2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { getBanners, BannersData } from "@/app/admin/settings/actions";

export default function WelcomePage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [banners, setBanners] = useState<BannersData | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Ao detectar usuário logado, redireciona para o dashboard apropriado
                try {
                    const { getPublicProfile } = await import("@/app/actions/profile");
                    const profile = await getPublicProfile(user.uid);
                    if (profile?.role === 'teacher' || profile?.role === 'admin') {
                        window.location.href = '/dashboard-teacher';
                    } else {
                        window.location.href = '/dashboard-student';
                    }
                } catch (error) {
                    console.error("Erro ao redirecionar:", error);
                }
            }

            async function fetchTopCourses() {
                setLoading(true);
                try {
                    const coursesRef = collection(db, 'courses');
                    const q = query(coursesRef, where('status', '==', 'published'), limit(4));
                    const querySnapshot = await getDocs(q);
                    const coursesData = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            price: Number(data.price) || 0
                        };
                    });
                    setCourses(coursesData);
                } catch (error) {
                    console.error("Erro ao buscar cursos:", error);
                } finally {
                    setLoading(false);
                }
            }
            fetchTopCourses();
        });

        getBanners().then(data => setBanners(data));

        return () => unsubscribe();
    }, []);

    const benefits = [
        {
            icon: Clock,
            title: "Aproveite no seu ritmo",
            description: "Assista quando e onde quiser. Sem horários fixos, sem pressão. Avance conforme sua agenda.",
        },
        {
            icon: Infinity,
            title: "Acesso ilimitado",
            description: "Um único plano para todos os cursos da plataforma. Explore e reexplore o quanto quiser.",
        },
        {
            icon: Award,
            title: "Certificação profissional",
            description: "Certificados reconhecidos pelo mercado ao concluir cada trilha. Comprove seu domínio técnico.",
        },
        {
            icon: Headphones,
            title: "Suporte de especialistas",
            description: "Conte com mentores e uma comunidade ativa para tirar dúvidas e acelerar seu crescimento.",
        },
    ];

    return (
        <div style={{ minHeight: "100vh", color: "#e2e8f0" }}>
            {/* ───────────────── HERO SECTION ───────────────── */}
            <section className="hero-section">

                {/* Dark overlay */}
                <div className="hero-overlay" />

                {/* Conteúdo central */}
                <div
                    className="hero-content flex-1 flex flex-col items-center justify-center text-center px-4"
                    style={{ paddingTop: "40px", paddingBottom: "60px" }}
                >
                    {/* Badge */}
                    <span
                        style={{
                            background: "rgba(50,205,50,0.15)",
                            border: "1px solid rgba(50,205,50,0.35)",
                            color: "#32cd32",
                            fontSize: "0.7rem",
                            fontWeight: 900,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            padding: "0.3rem 1rem",
                            borderRadius: "999px",
                            marginBottom: "1.5rem",
                            display: "inline-block",
                        }}
                    >
                        PowerPlay — Plataforma de Ensino Profissional
                    </span>

                    {/* Título */}
                    <h1
                        style={{
                            fontSize: "clamp(2.2rem, 6vw, 5rem)",
                            fontWeight: 900,
                            color: "#fff",
                            lineHeight: 1.05,
                            letterSpacing: "-0.02em",
                            textTransform: "uppercase",
                            marginBottom: "1rem",
                            textShadow: "0 4px 30px rgba(0,0,0,0.7)",
                        }}
                    >
                        DOMINE A TECNOLOGIA.<br />
                        <span style={{ color: "#32cd32" }}>CRIE O FUTURO.</span>
                    </h1>

                    {/* Subtítulo */}
                    <p
                        style={{
                            color: "rgba(255,255,255,0.8)",
                            fontSize: "clamp(1rem, 2vw, 1.2rem)",
                            fontWeight: 500,
                            marginBottom: "2.5rem",
                            maxWidth: "520px",
                            lineHeight: 1.6,
                        }}
                    >
                        Cursos ilimitados em Engenharia Elétrica &amp; Computação
                    </p>

                    {/* Email + CTA */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            width: "100%",
                            maxWidth: "600px",
                        }}
                        className="hero-form-container"
                    >
                        <div style={{ flex: 1, position: "relative" }}>
                            <input
                                type="email"
                                className="hero-email-input"
                                placeholder="Seu melhor e-mail"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>
                        <Link href={`/register${email ? `?email=${encodeURIComponent(email)}` : ""}`} style={{ width: "auto" }}>
                            <button className="btn-cta" style={{ whiteSpace: "nowrap", padding: "0.9rem 2rem" }}>
                                VAMOS LÁ
                            </button>
                        </Link>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", marginTop: "0.75rem" }}>
                        Sem compromisso. Cancele quando quiser.
                    </p>
                </div>

                {/* Gradient fade into next section */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "120px",
                        background: "linear-gradient(to bottom, transparent, #000)",
                        zIndex: 2,
                    }}
                />
            </section>

            {/* ───────────────── DIVISÓRIA COM FRASE ───────────────── */}
            <div
                style={{
                    textAlign: "center",
                    padding: "1.5rem 1rem 1rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                <p
                    style={{
                        fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
                        color: "rgba(255,255,255,0.75)",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                    }}
                >
                    Junte-se a <span style={{ color: "#32cd32", fontWeight: 900 }}>milhares de profissionais</span> que já transformaram suas carreiras.
                </p>
            </div>

            {/* ───────────────── TREINAMENTOS EM DESTAQUE ───────────────── */}
            <section
                style={{
                    padding: "2rem 1rem",
                    maxWidth: "1280px",
                    margin: "0 auto",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
                    <h2
                        style={{
                            fontSize: "clamp(1.3rem, 2.5vw, 2rem)",
                            fontWeight: 900,
                            color: "#fff",
                            textTransform: "uppercase",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        TREINAMENTOS EM <span style={{ color: "#32cd32" }}>DESTAQUE</span>
                    </h2>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                        Explore nossos melhores conteúdos pensados para sua evolução.
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: "1.5rem",
                    }}
                >
                    {loading ? (
                        <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "center", padding: "5rem 0" }}>
                            <Loader2 className="animate-spin" size={36} style={{ color: "#32cd32" }} />
                        </div>
                    ) : courses.map((course: any, i: number) => (
                        <Link
                            key={i}
                            href={`/course/${course.id}`}
                            style={{ textDecoration: "none", width: "280px", maxWidth: "100%" }}
                        >
                            <div className="course-card-dark group" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                                {/* Thumbnail */}
                                <div style={{ aspectRatio: "16/9", overflow: "hidden", borderRadius: "10px 10px 0 0" }}>
                                    <img
                                        src={course.image_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                                        alt={course.title}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            transition: "transform 0.5s ease",
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.07)")}
                                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                                    />
                                </div>
                                {/* Info */}
                                <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    <span
                                        style={{
                                            fontSize: "0.65rem",
                                            fontWeight: 900,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.12em",
                                            color: "#32cd32",
                                        }}
                                    >
                                        {course.tag || "PREMIUM"}
                                    </span>
                                    <h3
                                        style={{
                                            color: "#e2e8f0",
                                            fontWeight: 700,
                                            fontSize: "0.9rem",
                                            lineHeight: 1.4,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {course.title}
                                    </h3>
                                    <div
                                        style={{
                                            marginTop: "auto",
                                            paddingTop: "0.75rem",
                                            borderTop: "1px solid rgba(255,255,255,0.05)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em" }}>
                                                Investimento
                                            </div>
                                            <div style={{ color: "#f1f5f9", fontWeight: 900, fontSize: "0.95rem" }}>
                                                R$ {course.price},00
                                            </div>
                                        </div>
                                        <div style={{ color: "#32cd32" }}>
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                    <Link href="/course">
                        <button
                            style={{
                                background: "transparent",
                                border: "1px solid rgba(50,205,50,0.4)",
                                color: "#32cd32",
                                fontWeight: 800,
                                fontSize: "0.8rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.15em",
                                padding: "0.6rem 2rem",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => {
                                const t = e.currentTarget;
                                t.style.background = "rgba(50,205,50,0.1)";
                            }}
                            onMouseLeave={e => {
                                const t = e.currentTarget;
                                t.style.background = "transparent";
                            }}
                        >
                            Ver catálogo completo →
                        </button>
                    </Link>
                </div>
            </section>

            {/* ───────────────── BENEFITS SECTION ───────────────── */}
            <section style={{ padding: "2.5rem 1rem", maxWidth: "1280px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <h2
                        style={{
                            fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                            fontWeight: 900,
                            color: "#fff",
                            textTransform: "uppercase",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        POR QUE ESCOLHER A <span style={{ color: "#32cd32" }}>POWERPLAY?</span>
                    </h2>
                    <p style={{ color: "#94a3b8", marginTop: "0.75rem", fontSize: "1rem" }}>
                        Uma plataforma pensada para quem leva o conhecimento a sério.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "1.5rem",
                    }}
                >
                    {benefits.map((b, i) => {
                        const Icon = b.icon;
                        return (
                            <div key={i} className="benefit-card">
                                <div
                                    style={{
                                        width: "56px",
                                        height: "56px",
                                        borderRadius: "14px",
                                        background: "rgba(50,205,50,0.12)",
                                        border: "1px solid rgba(50,205,50,0.25)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: "1.25rem",
                                        color: "#32cd32",
                                    }}
                                >
                                    <Icon size={26} />
                                </div>
                                <h3
                                    style={{
                                        color: "#f1f5f9",
                                        fontWeight: 800,
                                        fontSize: "1.05rem",
                                        marginBottom: "0.6rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.03em",
                                    }}
                                >
                                    {b.title}
                                </h3>
                                <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.65 }}>
                                    {b.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ───────────────── SEÇÃO DE BANNERS DINÂMICOS ───────────────── */}
            <section style={{ position: "relative" }}>
                {banners?.hero_home && banners.hero_home.length > 0 ? (
                    banners.hero_home
                        .sort((a, b) => a.order - b.order)
                        .map((banner, idx) => {
                            const isOdd = idx % 2 !== 0;
                            const isCenter = idx >= 2;

                            return (
                                <div
                                    key={idx}
                                    style={{
                                        position: "relative",
                                        height: "600px",
                                        width: "100%",
                                        overflow: "hidden",
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <img
                                        src={banner.url}
                                        alt={`Banner ${idx + 1}`}
                                        style={{
                                            objectFit: "cover",
                                            width: "100%",
                                            height: "100%",
                                            filter: "brightness(0.4)",
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: isCenter ? "center" : isOdd ? "flex-end" : "flex-start",
                                        }}
                                    >
                                        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem", width: "100%", display: "flex", flexDirection: "column", alignItems: isCenter ? "center" : isOdd ? "flex-end" : "flex-start" }}>
                                            <div style={{ maxWidth: "560px", display: "flex", flexDirection: "column", gap: "1.25rem", textAlign: isCenter || isOdd ? "right" : "left", alignItems: isCenter ? "center" : isOdd ? "flex-end" : "flex-start" }}>
                                                <span
                                                    style={{
                                                        fontSize: "0.7rem",
                                                        fontWeight: 900,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.2em",
                                                        color: "#fff",
                                                        background: "rgba(255,255,255,0.1)",
                                                        border: "1px solid rgba(255,255,255,0.15)",
                                                        padding: "0.3rem 1rem",
                                                        borderRadius: "999px",
                                                        backdropFilter: "blur(8px)",
                                                    }}
                                                >
                                                    {idx === 0 ? 'Experiência' : idx === 1 ? 'Metodologia' : 'Inovação'}
                                                </span>
                                                <h2
                                                    style={{
                                                        fontSize: "clamp(2rem, 4vw, 3.5rem)",
                                                        fontWeight: 900,
                                                        color: "#fff",
                                                        lineHeight: 1.1,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "-0.02em",
                                                    }}
                                                >
                                                    {idx === 0 ? (<>APRENDA COM <br /><span style={{ color: "#32cd32" }}>ESPECIALISTAS</span></>) : idx === 1 ? (<>LABORATÓRIOS DA <br /><span style={{ color: "#32cd32" }}>VIDA REAL</span></>) : (<>TRANSFORME SUA <br /><span style={{ color: "#32cd32" }}>CARREIRA</span> AGORA</>)}
                                                </h2>
                                                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.05rem", fontWeight: 500, lineHeight: 1.6 }}>
                                                    {idx === 0
                                                        ? 'Trilhas de conhecimento desenhadas por profissionais que lideram grandes projetos.'
                                                        : idx === 1
                                                            ? 'Nossa metodologia foca na resolução de desafios reais com ferramentas de ponta.'
                                                            : 'Junte-se a milhares de alunos que já alcançaram cargos de destaque.'}
                                                </p>
                                                <Link href={idx >= 2 ? "/course" : "/register"}>
                                                    <button className="btn-cta">
                                                        {idx >= 2 ? 'Explorar Cursos' : 'Começar agora'}
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                ) : (
                    <div style={{ position: "relative", height: "600px", width: "100%", overflow: "hidden" }}>
                        <img
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"
                            alt="Standard Banner"
                            style={{ objectFit: "cover", width: "100%", height: "100%", filter: "brightness(0.35)" }}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.9), transparent)", display: "flex", alignItems: "center" }}>
                            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
                                <div style={{ maxWidth: "520px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                    <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                                        Potencialize <br />seu Futuro
                                    </h2>
                                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", fontWeight: 500 }}>
                                        Inicie sua jornada na PowerPlay e domine o mercado.
                                    </p>
                                    <Link href="/register">
                                        <button className="btn-cta">Registrar Conta</button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>


            {/* ───────────────── GRID DE DIFERENCIAIS ───────────────── */}
            <section
                style={{
                    padding: "2.5rem 1rem",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
                    <h2
                        style={{
                            textAlign: "center",
                            fontSize: "clamp(1.3rem, 2.5vw, 2rem)",
                            fontWeight: 900,
                            color: "#fff",
                            textTransform: "uppercase",
                            letterSpacing: "-0.02em",
                            marginBottom: "3rem",
                        }}
                    >
                        NOSSOS <span style={{ color: "#32cd32" }}>DIFERENCIAIS</span>
                    </h2>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "2.5rem",
                        }}
                    >
                        {[
                            { Icon: TrendingUp, title: "Crescimento", text: "Acelere sua evolução técnica com trilhas pensadas para o mercado real." },
                            { Icon: Handshake, title: "Soluções", text: "Metodologias exclusivas que transformam desafios em oportunidades." },
                            { Icon: BarChart3, title: "Resultados", text: "Métricas claras e acompanhamento em tempo real do seu progresso." },
                        ].map(({ Icon, title, text }, i) => (
                            <div
                                key={i}
                                style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}
                            >
                                <div
                                    style={{
                                        width: "72px",
                                        height: "72px",
                                        borderRadius: "20px",
                                        background: "rgba(50,205,50,0.1)",
                                        border: "1px solid rgba(50,205,50,0.25)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#32cd32",
                                    }}
                                >
                                    <Icon size={32} />
                                </div>
                                <h3 style={{ color: "#f1f5f9", fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    {title}
                                </h3>
                                <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: "260px" }}>
                                    {text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}
