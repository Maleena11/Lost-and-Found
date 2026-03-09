import Header from "../shared/components/Header";
import Hero from "../shared/components/Hero";
import Stats from "../shared/components/Stats";
import OurServices from "../shared/components/OurServices";
import HowItWorks from "../shared/components/HowItWorks";
import AboutUs from "../shared/components/AboutUs";
import Footer from "../shared/components/Footer";
import ChatBotWidget from "../shared/components/ChatBotWidget";

export default function Home() {
  return (
    <>
     <ChatBotWidget />
      <Header />
     
      <Hero />
      <Stats />
      <OurServices />
      <HowItWorks />
      <AboutUs />
      <Footer />
    </>
  );
}
