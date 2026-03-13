import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PIX_KEY = "00020126360014br.gov.bcb.pix0114+557199724722852040000530398654041.005802BR5925Maxwel De Oliveira Figuei6009Sao Paulo62290525REC6920D7EDA18B824741864063040970";

export const PixDonation: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="donations" className="py-12 px-4 bg-zinc-900/50 border-y border-zinc-800">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-4 border border-emerald-500/20"
        >
          <Heart size={14} className="fill-current" />
          Apoie o Projeto
        </motion.div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
          Gostou do conteúdo?
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto mb-10 text-lg">
          Sua doação ajuda a manter o podcast no ar e com novos episódios toda semana. 
          Qualquer valor é bem-vindo!
        </p>

        <div className="grid md:grid-cols-2 gap-8 items-center bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl">
            <QRCodeSVG value={PIX_KEY} size={200} level="H" />
            <p className="text-zinc-900 text-xs mt-4 font-medium uppercase tracking-widest">Escaneie para doar</p>
          </div>

          <div className="text-left space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-2">Pix Copia e Cola</h3>
              <p className="text-zinc-500 text-sm mb-4">
                Se estiver no celular, copie o código abaixo e cole no seu aplicativo do banco.
              </p>
              <div className="relative group">
                <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 pr-12 text-zinc-400 font-mono text-xs break-all line-clamp-3">
                  {PIX_KEY}
                </div>
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Copiar código"
                >
                  {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <p className="text-zinc-500 text-xs">
                Favorecido: <span className="text-zinc-300">Maxwel De Oliveira Figueiredo</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
