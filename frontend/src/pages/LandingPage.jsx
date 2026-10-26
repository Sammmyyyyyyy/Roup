import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from '../store/appContext.js';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
const Icon = ({ name, size = 18, ...props }) => {
  const paths = {
    arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    ticket: <><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16a2 2 0 0 0 0-4v-2a2 2 0 0 0 0-4H4Z" /><path d="M13 7v2m0 3v2m0 3v2" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    ledger: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    spark: <path d="m12 2 1.7 7.3L21 12l-7.3 1.7L12 21l-1.7-7.3L3 12l7.3-2.7L12 2Z" />,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    nodes: <><circle cx="6" cy="12" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="m8 11 8-4M8 13l8 4" /></>,
    chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 2 5-7" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name] || paths.spark}</svg>;
};

function Brand({ large = false }) {
  return <a className={`brand${large ? ' brand-large' : ''}`} href="/" aria-label="Roup home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span>roup<span className="brand-dot">.</span></span></a>;
}

function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...props }) {
  return <Tag className={`reveal ${className}`} data-reveal="" style={{ '--reveal-delay': `${delay}ms` }} {...props}>{children}</Tag>;
}

function MarketLine() {
  return <svg className="hero-line-chart" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true" data-draw="">
    <defs><linearGradient id="heroLineGlow" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--chart-green, #44e6a0)" stopOpacity=".22" /><stop offset="1" stopColor="var(--chart-green, #44e6a0)" stopOpacity="0" /></linearGradient></defs>
    <path className="hero-chart-fill" d="M0 192C58 177 61 117 112 130s60 48 111 21 80-10 119-17 70-68 117-54 54 65 98 61 72-57 120-45 61 69 113 46 60-104 109-87 61 96 107 67 56-43 105-26 56 17 91-6 57-58 95-37 54 65 94 34 51-47 89-23 39 66 60 56v140H0Z" />
    <path className="hero-chart-stroke" pathLength="1" d="M0 192C58 177 61 117 112 130s60 48 111 21 80-10 119-17 70-68 117-54 54 65 98 61 72-57 120-45 61 69 113 46 60-104 109-87 61 96 107 67 56-43 105-26 56 17 91-6 57-58 95-37 54 65 94 34 51-47 89-23 39 66 60 56" />
  </svg>;
}

function OrderBook({ compact = false }) {
  const bids = [['$278.00', '2'], ['$272.50', '4'], ['$269.00', '1']];
  const asks = [['$284.00', '1'], ['$291.00', '3'], ['$298.50', '2']];
  return <div className={`orderbook${compact ? ' orderbook-compact' : ''}`}>
    <div className="book-half"><div className="book-title"><span>BUY ORDERS</span><span>PRICE <i>·</i> QTY</span></div>{bids.map(([price, qty], i) => <div className="book-row bid" key={price} style={{ '--depth': `${79 - i * 17}%` }}><b>{price}</b><span>× {qty}</span><i /></div>)}</div>
    <div className="book-half"><div className="book-title"><span>SELL ORDERS</span><span>PRICE <i>·</i> QTY</span></div>{asks.map(([price, qty], i) => <div className="book-row ask" key={price} style={{ '--depth': `${74 - i * 17}%` }}><b>{price}</b><span>× {qty}</span><i /></div>)}</div>
  </div>;
}

function MatchArtwork() {
  return <div className="match-art" aria-label="Illustration of buy and sell orders meeting under price-time rules">
    <div className="match-stack buyers"><span className="micro-label">BUY ORDERS</span><div className="match-chip"><span>Limit · $278</span><b>01</b></div><div className="match-chip"><span>Market · best available</span><b>02</b></div><div className="match-chip"><span>Limit · $269</span><b>03</b></div></div>
    <div className="match-core"><span>PRICE<br /><i>×</i><br />TIME</span><small>MATCH ENGINE</small></div>
    <div className="match-stack sellers"><span className="micro-label">SELL ORDERS</span><div className="match-chip"><b>01</b><span>Ask · $278</span></div><div className="match-chip"><b>02</b><span>Ask · $284</span></div><div className="match-chip"><b>03</b><span>Ask · $298</span></div></div>
  </div>;
}

function SettlementArtwork() {
  return <div className="settlement-art">
    <div className="settle-float settle-cap"><span className="micro-label">RESALE LIMIT</span><strong>1.2×</strong><small>of face value</small><div className="cap-meter"><i /></div></div>
    <div className="settle-float settle-ledger"><span className="micro-label">TRADE RECORD</span><div><b>Debit</b><strong>− $278.00</strong></div><div><b>Credit</b><strong>+ $278.00</strong></div><span className="settle-balance"><Icon name="check" size={12} /> Balanced entry · concept</span></div>
    <div className="settle-shield"><Icon name="shield" size={29} /><span>DELIVERY<br />VERIFIED</span></div>
    <div className="settle-connect" />
  </div>;
}

function AuctionArtwork() {
  return <div className="auction-artwork">
    <div className="auction-curve"><svg viewBox="0 0 350 180" preserveAspectRatio="none" aria-hidden="true"><path d="M10 20C85 48 122 68 177 93s93 40 164 63" /><path className="auction-area" d="M10 20C85 48 122 68 177 93s93 40 164 63V180H10Z" /></svg><span className="price-dot dot-start" /><span className="price-dot dot-now" /><span className="price-dot dot-end" /></div>
    <div className="auction-demo-card"><span className="micro-label">EXAMPLE CURRENT PRICE</span><strong>$180</strong><span className="auction-clock"><Icon name="clock" size={13} /> 03 : 42 : 18</span></div>
    <div className="auction-axis"><span>START · $240</span><span>NOW · $180</span><span>END · $120</span></div>
  </div>;
}

const slides = [
  { label: '01 / ORDER FLOW', title: 'Intelligent order matching', description: 'Match compatible buy and sell orders automatically, with transparent price-time priority at the core.', points: ['Limit and market orders', 'Price-time priority', 'Automatic matching for eligible orders'], visual: <MatchArtwork /> },
  { label: '02 / FAIR EXCHANGE', title: 'Secure and fair trading', description: 'Make resale rules visible and keep transaction records accountable.', points: ['Configurable resale price ceilings', 'Double-entry transaction accounting', 'Delivery-linked escrow workflows'], visual: <SettlementArtwork /> },
  { label: '03 / PRICE DISCOVERY', title: 'Dutch auctions', description: 'Explore another path to price discovery, with prices that decrease on a predefined schedule.', points: ['Scheduled price reductions', 'Visible price and remaining time', 'Buy at an available price, subject to availability'], visual: <AuctionArtwork /> },
];

function FeatureCarousel() {
  const viewportRef = useRef(null);
  const slideRefs = useRef([]);
  const pointerStart = useRef(null);
  const [active, setActive] = useState(0);
  const [offset, setOffset] = useState(0);
  const move = (index) => setActive((index + slides.length) % slides.length);

  useLayoutEffect(() => {
    const measure = () => setOffset(slideRefs.current[active]?.offsetLeft || 0);
    measure();
    const observer = new ResizeObserver(measure);
    if (viewportRef.current) observer.observe(viewportRef.current);
    slideRefs.current.forEach((slide) => slide && observer.observe(slide));
    return () => observer.disconnect();
  }, [active]);

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(active + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(active - 1); }
  };
  const onPointerUp = (event) => {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    if (Math.abs(distance) > 42) move(active + (distance < 0 ? 1 : -1));
    pointerStart.current = null;
  };

  return <div className="carousel-shell">
    <div className="carousel-viewport" ref={viewportRef} onKeyDown={onKeyDown} onPointerDown={(event) => { pointerStart.current = event.clientX; }} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; }} role="region" aria-roledescription="carousel" aria-label="Roup exchange capabilities" tabIndex="0">
      <div className="carousel-track" style={{ transform: `translate3d(${-offset}px,0,0)` }}>
        {slides.map((slide, index) => <article className={`carousel-slide${active === index ? ' is-active' : ''}`} key={slide.title} ref={(element) => { slideRefs.current[index] = element; }} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}: ${slide.title}`} aria-hidden={active !== index}>
          <div className="slide-copy"><span className="micro-label">{slide.label}</span><h3>{slide.title}</h3><p>{slide.description}</p><ul>{slide.points.map((point) => <li key={point}><span className="mint-bullet" />{point}</li>)}</ul></div>
          <div className="slide-visual">{slide.visual}</div>
        </article>)}
      </div>
    </div>
    <div className="carousel-controls"><div className="carousel-arrows"><button className="circle-arrow" type="button" aria-label="Previous feature" onClick={() => move(active - 1)}><span>←</span></button><button className="circle-arrow circle-arrow-next" type="button" aria-label="Next feature" onClick={() => move(active + 1)}><span>→</span></button></div><div className="carousel-progress" role="group" aria-label={`Feature ${active + 1} of ${slides.length}`}><span className="progress-track"><i style={{ width: `${((active + 1) / slides.length) * 100}%` }} /></span><span className="progress-count">0{active + 1}<i> / 0{slides.length}</i></span></div></div>
  </div>;
}

function DepthVisual() {
  const left = [40, 62, 83, 51, 74, 43, 66];
  const right = [58, 77, 48, 89, 54, 70, 36];
  return <div className="depth-visual"><div className="depth-legend"><span>BUY ORDERS <b>03</b></span><span>SELL ORDERS <b>03</b></span></div><div className="depth-viz-layout"><div className="depth-columns"><div className="depth-bars buy-bars">{left.map((v, i) => <i key={i} style={{ '--bar-size': `${v}%`, '--i': i }} />)}</div><div className="depth-mid"><span>$278</span><i /><span>$284</span><b>MID</b></div><div className="depth-bars sell-bars">{right.map((v, i) => <i key={i} style={{ '--bar-size': `${v}%`, '--i': i }} />)}</div></div><div className="depth-book"><span>PRICE</span><span>SIZE</span><span>SIDE</span><b>$278.00</b><i>2</i><em>BUY</em><b>$272.50</b><i>4</i><em>BUY</em><b>$284.00</b><i>1</i><strong>SELL</strong></div></div></div>;
}

function PriorityVisual() {
  return <div className="priority-visual"><div><span>01 <i>EARLIEST AT BEST PRICE</i></span><b>$278.00</b><em>LIMIT BUY</em></div><div><span>02 <i>SAME PRICE · LATER</i></span><b>$278.00</b><em>LIMIT BUY</em></div><div><span>03 <i>LOWER PRICE</i></span><b>$272.00</b><em>LIMIT BUY</em></div><small><Icon name="spark" size={12} /> PRICE FIRST <i>→</i> TIME NEXT</small></div>;
}

function CapVisual() {
  return <div className="cap-visual"><div className="cap-value"><span>FACE VALUE</span><b>$240</b></div><div className="cap-range"><i /><span>PERMITTED RESALE RANGE</span><b>MAX $288</b></div><div className="cap-lock"><Icon name="shield" size={15} /> 1.2× CAP</div></div>;
}

function LedgerVisual() {
  return <div className="ledger-visual"><div className="ledger-line"><span>TRADE DEBIT</span><b>− $278.00</b></div><div className="ledger-line"><span>SELLER CREDIT</span><b>+ $278.00</b></div><div className="ledger-balance"><Icon name="check" size={13} /> Entries balance <span>DESIGNED FLOW</span></div></div>;
}

function FlowVisual() {
  return <div className="flow-visual"><div className="flow-orbit orbit-one" /><div className="flow-orbit orbit-two" /><div className="flow-node"><Icon name="nodes" size={24} /></div>{Array.from({ length: 7 }, (_, i) => <i className={`flow-pip pip-${i + 1}`} key={i} />)}<div className="flow-caption">ORDER FLOW <span>·</span> CONCURRENCY CONCEPT</div></div>;
}

function TicketJourney() {
  return <div className="journey-visual" data-parallax="">
    <div className="journey-glow" />
    <div className="journey-poster"><span>LIMITED EDITION · 2025</span><strong>NORTH<br />SHORE</strong><i>SESSIONS</i><small>3-DAY FESTIVAL PASS</small><b>08—10<br />AUG</b></div>
    <div className="journey-order journey-order-one"><span className="micro-label">BUY ORDER</span><strong>$278.00</strong><i>LIMIT · OPEN</i></div>
    <div className="journey-order journey-order-two"><span className="micro-label">MATCHED</span><strong><Icon name="check" size={13} /> Order pair</strong><i>PRICE · TIME</i></div>
    <div className="journey-settlement"><span className="journey-settle-mark"><Icon name="ticket" size={16} /></span><div><b>Settlement record</b><small>Delivery verification · pending</small></div><span className="journey-pending">IN DESIGN</span></div>
    <div className="journey-path"><i /><i /><i /></div>
    <div className="journey-label"><span>LISTED</span><span>MATCHED</span><span>SETTLED</span></div>
  </div>;
}

function ShowcaseTicket() {
  return <div className="showcase-ticket"><div className="showcase-ticket-grid" /><span className="showcase-overline">NORTH SHORE SESSIONS <i>·</i> 2025</span><div className="showcase-rings"><i /><i /><i /><b>NS</b></div><strong>AFTER<br />THE<br />GLOW</strong><span className="showcase-bottom">PORTLAND, OREGON <i>—</i> 3 DAY</span><span className="showcase-ticket-cut cut-top" /><span className="showcase-ticket-cut cut-bottom" /></div>;
}

function ShowcaseDepth() {
  return <div className="mini-depth-art"><div className="mini-depth-head"><span>LEVEL 2 · EXAMPLE</span><i>SIMULATED</i></div><div className="mini-depth-price">$281.00 <small>INDICATIVE MID</small></div><div className="mini-depth-bars"><div>{[46, 68, 84, 54, 73].map((h, i) => <i key={i} style={{ '--bar-size': `${h}%` }} />)}</div><span>$278 <i /> $284</span><div>{[60, 78, 52, 90, 61].map((h, i) => <i key={i} style={{ '--bar-size': `${h}%` }} />)}</div></div><div className="mini-depth-foot"><span>BUY 3 LEVELS</span><span>SELL 3 LEVELS</span></div></div>;
}

function ContextArt() {
  return <div className="context-art"><div className="context-ticket"><span>FESTIVAL PASS</span><b>NS<br />’25</b><i>3 DAY</i></div><div className="context-order"><span>RECENT EXAMPLE ORDER</span><b>$278.00</b><small>Limit · 1 pass</small><i><Icon name="check" size={11} /> Recorded concept</i></div><div className="context-orbit" /></div>;
}

function Navbar({ session }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const links = [['Marketplace', '/explore'], ['Markets', '#showcase'], ['How It Works', '#journey'], ['Auctions', '#feature-carousel'], ['Trust & Safety', '#feature-grid']];
  useEffect(() => {
    const escape = (event) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  return <header className="site-header"><div className="nav-wrap shell"><Brand /><button className="nav-toggle" type="button" aria-expanded={open} aria-controls="main-nav" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} size={20} /></button><nav className={`nav-pill${open ? ' nav-open' : ''}`} id="main-nav" aria-label="Main navigation">{links.map(([name, href]) => <a key={name} href={href} onClick={(event) => { setOpen(false); if (href.startsWith('/')) { event.preventDefault(); navigate(href); } }}>{name}</a>)}<a className="mobile-auth-link" href="/login" onClick={(event) => { event.preventDefault(); setOpen(false); navigate('/login'); }}>Sign in</a><a className="mobile-auth-link" href="/signup" onClick={(event) => { event.preventDefault(); setOpen(false); navigate('/signup'); }}>Create account</a><div className="mobile-theme-toggle"><ThemeToggle compact /></div><a className="nav-go" href="/explore" aria-label="Explore the exchange" onClick={(event) => { event.preventDefault(); setOpen(false); navigate('/explore'); }}><Icon name="arrow" /></a></nav><div className="nav-account"><ThemeToggle /><span className="nav-account-separator" aria-hidden="true" />{session ? <span className="nav-signed-in" title={session.user.emailId}>Signed in</span> : <a className="nav-signin" href="/login" onClick={(event) => { event.preventDefault(); setOpen(false); navigate('/login'); }}>Sign in</a>}<a className="nav-account-cta" href="/signup" onClick={(event) => { event.preventDefault(); setOpen(false); navigate('/signup'); }}>{session ? 'Account' : 'Create account'}</a></div></div></header>;
}

function useScrollEffects() {
  useEffect(() => {
    const revealItems = [...document.querySelectorAll('[data-reveal]')];
    const staggerGroups = ['.capability-panel', '.feature-grid', '.showcase-support', '.footer-links'];
    staggerGroups.forEach((selector) => {
      const group = document.querySelector(selector);
      group?.querySelectorAll('[data-reveal]').forEach((item, index) => item.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 95}ms`));
    });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      document.querySelectorAll('[data-draw]').forEach((item) => item.classList.add('is-drawn'));
      document.querySelectorAll('.timeline-step').forEach((item) => item.classList.add('is-current'));
      document.querySelector('.timeline-list')?.style.setProperty('--timeline-progress', '100%');
      return;
    }
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px 36px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));

    const drawObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-drawn'); observer.unobserve(entry.target); }
    }), { threshold: 0.2 });
    document.querySelectorAll('[data-draw]').forEach((item) => drawObserver.observe(item));

    const timeline = document.querySelector('.timeline-list');
    const steps = [...document.querySelectorAll('.timeline-step')];
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = steps.indexOf(entry.target);
        steps.forEach((step, i) => {
          step.classList.toggle('is-complete', i < index);
          step.classList.toggle('is-current', i === index);
          step.setAttribute('aria-current', i === index ? 'step' : 'false');
        });
        if (timeline) timeline.style.setProperty('--timeline-progress', `${((index + 0.65) / steps.length) * 100}%`);
      });
    }, { rootMargin: '-38% 0px -48% 0px', threshold: 0 });
    steps.forEach((step) => timelineObserver.observe(step));

    let frame = 0;
    const parallax = () => {
      frame = 0;
      const art = document.querySelector('[data-parallax]');
      if (!art) return;
      const rect = art.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const distance = Math.max(-12, Math.min(12, (rect.top - innerHeight * 0.5) * -0.018));
      art.style.setProperty('--art-shift', `${distance}px`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(parallax); };
    window.addEventListener('scroll', onScroll, { passive: true });
    parallax();
    return () => {
      revealObserver.disconnect();
      drawObserver.disconnect();
      timelineObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}

function Hero() {
  return <section className="hero" id="top" aria-labelledby="hero-title"><div className="hero-ambient" /><div className="hero-content shell">
    <Reveal className="hero-eyebrow"><span className="live-dot" />THE SECONDARY MARKETPLACE, REIMAGINED</Reveal>
    <Reveal as="h1" className="hero-title" id="hero-title" delay={70}><span>Rare Passes.</span> <span>Real Markets.</span><br /><em>Fairer Trades.</em></Reveal>
    <Reveal className="hero-description" delay={170}><p>Discover, buy, and resell limited-edition festival passes and collectibles through a transparent marketplace built for real-time trading.</p></Reveal>
    <Reveal className="hero-actions" delay={270}><a className="button button-primary" href="/explore">Explore Exchange <Icon name="arrow" size={17} /></a><a className="button button-secondary" href="#journey">See How It Works <span>↘</span></a></Reveal>
    <Reveal className="hero-highlights" delay={360}><span><Icon name="check" size={14} />Real-time order matching</span><span><Icon name="check" size={14} />Transparent market depth</span><span><Icon name="check" size={14} />Configurable resale limits</span></Reveal>
  </div><div className="hero-chart-wrap"><MarketLine /><span className="chart-side-label">ILLUSTRATIVE MARKET SIGNAL <i>·</i> NOT LIVE DATA</span></div></section>;
}

const capabilityData = [
  { icon: 'spark', number: '01', title: 'Smart order matching', text: 'Compatible buy and sell orders are matched according to price-time priority.', link: 'How orders meet', href: '#feature-carousel' },
  { icon: 'chart', number: '02', title: 'Live market depth', text: 'Understand available bids, asks, and market activity before placing an order.', link: 'See the market', href: '#feature-grid' },
  { icon: 'shield', number: '03', title: 'Fair resale rules', text: 'Configurable resale price ceilings help restrict orders that exceed permitted limits.', link: 'Built for fairness', href: '#feature-grid' },
  { icon: 'ledger', number: '04', title: 'Accountable settlement', text: 'Transaction records and settlement workflows are designed to keep trades traceable.', link: 'Follow a trade', href: '#journey' },
];

function Capabilities() {
  return <section className="section capabilities-section" id="capabilities" aria-labelledby="capabilities-title"><div className="shell"><Reveal className="center-heading"><p className="eyebrow">YOUR SECONDARY MARKETPLACE</p><h2 id="capabilities-title">Everything you need to<br /><span>trade with clarity.</span></h2><p>Discover sought-after items, understand the market, and trade through transparent rules designed for buyers and sellers.</p></Reveal>
    <div className="capability-panel">{capabilityData.map((item) => <article className="capability" data-reveal="" key={item.number}><span className="capability-icon"><Icon name={item.icon} size={19} /></span><span className="capability-number">{item.number} / EXCHANGE</span><h3>{item.title}</h3><p>{item.text}</p><a href={item.href}>{item.link}<Icon name="arrow" size={13} /></a></article>)}</div>
    <div className="center-action"><a className="button button-primary" href="/explore">Explore the Exchange <Icon name="arrow" size={16} /></a></div>
  </div></section>;
}

function CarouselSection() {
  return <section className="section carousel-section" id="feature-carousel" aria-labelledby="carousel-title"><div className="shell"><Reveal className="center-heading carousel-intro"><p className="eyebrow">A MORE THOUGHTFUL WAY TO TRADE</p><h2 id="carousel-title">The exchange, <span>in motion.</span></h2><p>Useful tools and visible rules, designed around every side of a ticket trade.</p></Reveal><FeatureCarousel /></div></section>;
}

function FeatureGrid() {
  return <section className="section grid-section" id="feature-grid" aria-labelledby="grid-title"><div className="shell"><Reveal className="center-heading grid-intro"><p className="eyebrow">ENGINEERED FOR A CLEARER EXCHANGE</p><h2 id="grid-title">The details that make<br /><span>every trade work.</span></h2><p>From price discovery to settlement, the exchange is designed around transparent rules and accountable trading.</p></Reveal>
    <div className="feature-grid">
      <article className="grid-card priority-card" data-reveal=""><div className="grid-card-heading"><span className="micro-label">01 / ORDER QUEUE</span><Icon name="clock" size={17} /></div><h3>Price-time priority</h3><p>Better-priced orders take precedence. At the same price, the earlier order is served first.</p><PriorityVisual /></article>
      <article className="grid-card depth-card" data-reveal=""><div className="grid-card-heading"><span className="micro-label">02 / LEVEL 2 CONCEPT</span><span className="simulated-tag"><i /> SIMULATED</span></div><div className="depth-card-copy"><div><h3>Real-time market depth</h3><p>See the available buy and sell orders around a clear midpoint.</p></div><div className="depth-summary"><span>INDICATIVE MID</span><b>$281.00</b><small>illustrative only</small></div></div><DepthVisual /></article>
      <article className="grid-card cap-card" data-reveal=""><div className="grid-card-heading"><span className="micro-label">03 / PRICE PROTECTION</span><Icon name="shield" size={16} /></div><h3>Anti-scalping price caps</h3><p>Configurable resale ceilings can be set against an item's original face value.</p><CapVisual /></article>
      <article className="grid-card ledger-card" data-reveal=""><div className="grid-card-heading"><span className="micro-label">04 / TRACEABLE RECORDS</span><Icon name="ledger" size={16} /></div><h3>Atomic settlement</h3><p>Ledger architecture is designed to record both sides consistently and help prevent partial balance updates.</p><LedgerVisual /></article>
      <article className="grid-card flow-card" data-reveal=""><div className="grid-card-heading"><span className="micro-label">05 / SYSTEM DESIGN</span><Icon name="nodes" size={16} /></div><h3>Concurrency in mind</h3><p>Order processing is being designed for concurrent activity. No throughput claims are implied.</p><FlowVisual /></article>
    </div>
    <p className="disclosure-note"><span /> Product safeguards and exchange mechanics are design capabilities; implementation and availability may vary.</p>
  </div></section>;
}

const journeySteps = [
  ['Discover', 'Find a festival pass or collectible you want.', '01 / FIND YOUR ITEM'],
  ['Place an order', 'Choose a limit order or a market order based on your trading preference.', '02 / SET YOUR TERMS'],
  ['Get matched', 'Compatible orders are matched according to price-time priority.', '03 / PRICE MEETS TIME'],
  ['Track settlement', 'Follow transaction records and settlement status.', '04 / FOLLOW THE RECORD'],
];

function Journey() {
  return <section className="section journey-section" id="journey" aria-labelledby="journey-title"><div className="shell journey-layout"><Reveal className="journey-heading"><p className="eyebrow">HOW THE EXCHANGE WORKS</p><h2 id="journey-title">From discovery<br /><span>to settlement.</span></h2><p>A considered journey, with clear steps and visible rules from the first look to the final transaction record.</p></Reveal><Reveal className="journey-art-wrap" delay={120}><TicketJourney /></Reveal>
    <ol className="timeline-list">{journeySteps.map(([title, text, phase], index) => <li className="timeline-step" key={title} data-reveal="" aria-current="false"><span className="timeline-marker">0{index + 1}</span><div><span className="timeline-phase">{phase}</span><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
  </div></section>;
}

function Showcase() {
  return <section className="section showcase-section" id="showcase" aria-labelledby="showcase-title"><div className="shell"><Reveal className="showcase-heading"><div><p className="eyebrow">A MARKET FOR YOUR NEXT MOMENT</p><h2 id="showcase-title">Made for the moments<br /><span>that matter.</span></h2></div><p>Discover limited-edition festival passes, event tickets, and collectibles, with a clearer view of their listed prices and availability.</p></Reveal>
    <Reveal as="article" className="showcase-feature"><div className="showcase-feature-copy"><span className="micro-label">FEATURED EXAMPLE <i>·</i> FESTIVAL PASS</span><h3>North Shore<br />Sessions</h3><p>Three days by the water. An example listing for a pass to the late-summer festival.</p><div className="showcase-prices"><div><span>ORIGINAL FACE VALUE</span><b>$240</b></div><i /><div><span>EXAMPLE ASKING PRICE</span><b>$284</b></div></div><div className="showcase-availability"><i /> Example listing <span>·</span> Portland, OR <span>·</span> Aug 08–10</div><a className="button button-primary" href="/explore">Explore Marketplace <Icon name="arrow" size={16} /></a><small>Illustrative demo data · no live listing or activity shown</small></div><div className="showcase-feature-art"><ShowcaseTicket /></div></Reveal>
    <div className="showcase-support"><Reveal as="article" className="support-card"><div className="support-copy"><span className="micro-label">MARKET CONTEXT <i>·</i> SIMULATED</span><h3>See the market clearly.</h3><p>Understand the relationship between available buy and sell orders.</p></div><ShowcaseDepth /></Reveal><Reveal as="article" className="support-card support-card-context" delay={90}><div className="support-copy"><span className="micro-label">A TRADE, MADE TRACEABLE</span><h3>Trade with better context.</h3><p>Keep item information, pricing context, and transaction activity easier to understand.</p></div><ContextArt /></Reveal></div>
  </div></section>;
}

function Footer() {
  const footerGroups = [
    { title: 'EXPLORE', links: [['Marketplace', '#showcase'], ['Markets', '#feature-grid'], ['How It Works', '#journey']] },
    { title: 'THE EXCHANGE', links: [['Features', '#capabilities'], ['Auctions', '#feature-carousel'], ['Trust & Safety', '#feature-grid']] },
  ];
  return <footer className="site-footer" id="footer"><div className="shell footer-top"><div className="footer-brand-block"><Brand /><p>A secondary marketplace for limited-edition passes and collectibles.</p><span className="footer-note"><i /> A market for the moments that matter</span></div><div className="footer-links">{footerGroups.map((group) => <div key={group.title}><span className="footer-label">{group.title}</span>{group.links.map(([label, href]) => <a href={href} key={label}>{label}</a>)}</div>)}<div><span className="footer-label">ROUP EXCHANGE</span><span className="footer-legal">Terms &amp; Privacy</span><span className="footer-legal">Contact details coming soon</span></div></div></div><div className="shell footer-bottom"><span>© 2026 Roup Exchange</span><span>Prices and market information are illustrative</span><a href="#top">Back to top ↑</a></div><div className="footer-wordmark-wrap" data-reveal=""><div className="footer-wordmark" aria-hidden="true">Roup</div></div></footer>;
}

export default function LandingPage({ session, notice, onDismissNotice }) {
  useScrollEffects();
  return <><Navbar session={session} />{notice && <div className="auth-toast" role="status"><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={onDismissNotice}>×</button></div>}<main><Hero /><Capabilities /><CarouselSection /><FeatureGrid /><Journey /><Showcase /></main><Footer /> </>;
}

