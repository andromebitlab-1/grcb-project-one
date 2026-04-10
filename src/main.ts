import './style.css';

class GRCB {
  private memory: string[] = [];
  private modoDelirio: boolean = true;
  private modoImaginacion: boolean = true;
  private chatMessages: HTMLElement;
  private userInput: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private toggleBtn: HTMLButtonElement;

  constructor() {
    this.chatMessages = document.getElementById('chat-messages')!;
    this.userInput = document.getElementById('user-input') as HTMLTextAreaElement;
    this.sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    this.toggleBtn = document.getElementById('toggle-imagination') as HTMLButtonElement;

    this.initEvents();
    this.initProt();
  }

  private initProt() {
    // Bloquear click derecho
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Bloquear atajos de teclado de inspección
    document.addEventListener('keydown', (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl + Shift + I / J / C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }

      // Ctrl + U (Ver código fuente)
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        return false;
      }
    });

    console.log("%c¡Detente!", "color: red; font-size: 50px; font-weight: bold; -webkit-text-stroke: 1px black;");
    console.log("%cEl acceso al código está restringido por protocolos orbitales.", "font-size: 18px; color: white; background: #0f172a; padding: 10px;");
  }

  private initEvents() {
    this.sendBtn.onclick = () => this.handleSendMessage();

    this.userInput.onkeydown = (e) => {
      // Ctrl + Enter to send
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.handleSendMessage();
      }

      // Ctrl + P to toggle imagination
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        this.toggleImagination();
      }
    };

    this.toggleBtn.onclick = () => this.toggleImagination();

    // Auto-resize textarea
    this.userInput.oninput = () => {
      this.userInput.style.height = 'auto';
      this.userInput.style.height = this.userInput.scrollHeight + 'px';
    };
  }

  private toggleImagination() {
    this.modoImaginacion = !this.modoImaginacion;
    this.toggleBtn.classList.toggle('active', this.modoImaginacion);
    
    this.addMessageInstant(
      this.modoImaginacion 
        ? "[Modo imaginación ACTIVADO 🧠]" 
        : "[Modo imaginación DESACTIVADO 📎]", 
      false
    );
  }

  private async handleSendMessage() {
    const text = this.userInput.value.trim();
    if (!text) return;

    this.userInput.value = '';
    this.userInput.style.height = 'auto';
    
    this.addMessageInstant(text, true);
    this.memory.push("Usuario: " + text);

    const thinkingId = this.showThinking();
    
    try {
      const response = await this.generarRespuesta(text);
      this.removeThinking(thinkingId);
      
      this.memory.push("Bot: " + response);
      await this.addMessageTyping(response);
    } catch (error) {
      console.error(error);
      this.removeThinking(thinkingId);
      this.addMessageInstant("Error conectando con el vacío orbital... Inténtalo de nuevo.", false);
    }
  }

  private async generarRespuesta(query: string): Promise<string> {
    // Simplify query for initial search
    const simplifiedQuery = query.split(' ').filter(w => w.length > 3).slice(0, 5).join(' ');
    
    let results = await this.performSearches(simplifiedQuery || query);

    // First retry: just the raw query
    if (results.length === 0) {
      results = await this.performSearches(query);
    }

    // Second retry: absolute fallback (random stuff)
    if (results.length === 0) {
      results = await this.performSearches(""); 
    }

    if (results.length === 0) {
      return "No hay resultados claros.\n\nPero alguien en internet dijo:\n\"Probablemente sí.\"";
    }

    // Pick random count of results
    const count = Math.min(results.length, Math.floor(Math.random() * 3) + 1);
    const selected = results
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    let mezcla = selected.join("\n\n---\n\n");

    if (this.modoDelirio) {
      mezcla = this.aplicarDelirio(mezcla);
    }

    if (this.modoImaginacion) {
      mezcla = this.limpiarParaImaginacion(mezcla);
    }

    return mezcla;
  }

  private async performSearches(query: string): Promise<string[]> {
    const searches = [
      this.buscarReddit(query),
      this.buscar4chan(query),
      this.buscarReddit(query ? "" : "random"), // Fallback to random if query is empty or failed
      this.buscar4chan("") // Always try random 4chan as last resort
    ];

    const results = (await Promise.all(searches))
      .filter(r => r !== null) as string[];

    return results;
  }

  private async buscarReddit(query: string): Promise<string | null> {
    try {
      const q = query ? encodeURIComponent(query) : "copypasta";
      const url = `/api-reddit/search.json?q=${q}&limit=10&sort=relevance`;
      const response = await fetch(url);
      const data = await response.json();
      
      const posts = data.data.children;
      if (!posts || posts.length === 0) {
        // Absolute fallback to a fun subreddit
        const fallbackUrl = `/api-reddit/r/copypasta/random.json`;
        const fbRes = await fetch(fallbackUrl);
        const fbData = await fbRes.json();
        const post = Array.isArray(fbData) ? fbData[0].data.children[0].data : fbData.data.children[0].data;
        return this.processRedditPost(post);
      }

      const post = posts[Math.floor(Math.random() * posts.length)].data;
      return this.processRedditPost(post);
    } catch {
      return null;
    }
  }

  private async processRedditPost(post: any): Promise<string> {
    const title = post.title;
    const content = post.selftext || title;
    const link = "https://reddit.com" + post.permalink;

    let result = `${title}\n\n${content}`;
    result = await this.traducir(result);
    result = this.formatearTexto(result);

    return `[Reddit]\n${result}\n\n🔗 ${link}`;
  }

  private async buscar4chan(query: string): Promise<string | null> {
    try {
      const boards = ["g", "x", "pol", "biz"];
      const board = boards[Math.floor(Math.random() * boards.length)];
      
      const url = `/api-4chan/${board}/catalog.json`;
      const response = await fetch(url);
      const data = await response.json();

      const words = query.toLowerCase().split(' ');
      
      let threads: any[] = [];
      data.forEach((page: any) => {
        page.threads.forEach((t: any) => {
          if (t.com) {
            const text = t.com.toLowerCase();
            if (words.some(w => text.includes(w))) {
              threads.push(t);
            }
          }
        });
      });

      if (threads.length === 0) {
        data.forEach((page: any) => {
          page.threads.forEach((t: any) => {
            if (t.com) threads.push(t);
          });
        });
      }

      if (threads.length === 0) return null;

      const thread = threads[Math.floor(Math.random() * threads.length)];
      let text = thread.com;
      const threadId = thread.no;
      const link = `https://boards.4chan.org/${board}/thread/${threadId}`;

      // Decode HTML entities
      const doc = new DOMParser().parseFromString(text, 'text/html');
      text = doc.body.textContent || "";
      
      text = await this.traducir(text);
      text = this.formatearTexto(text);

      return `[4chan/${board}]\n${text}\n\n🔗 ${link}`;
    } catch {
      return null;
    }
  }

  private formatearTexto(texto: string): string {
    const lineas = texto.split('\n');
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i].trim();
      if (l.startsWith('"') || l.startsWith('>')) {
        lineas[i] = `*${l}*`;
      } else if (l.length > 40 && Math.random() < 0.3) {
        lineas[i] = `**${l}**`;
      }
    }
    return lineas.join('\n');
  }

  private async traducir(texto: string): Promise<string> {
    try {
      // Chunk text to avoid URL length limits
      const max = 1000;
      const chunks = [];
      for (let i = 0; i < texto.length; i += max) {
        chunks.push(texto.substring(i, i + max));
      }

      let translated = "";
      for (const chunk of chunks) {
        const url = `/api-translate/&q=${encodeURIComponent(chunk)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Google Translate "gtx" format: data[0] is an array of segments
        // Each segment is [translated, source, ...]
        if (data && data[0]) {
          for (const segment of data[0]) {
            if (segment && segment[0]) {
              translated += segment[0];
            }
          }
        } else {
          translated += chunk;
        }
        translated += " ";
      }

      return translated.trim();
    } catch (e) {
      console.error("Translation error:", e);
      return texto;
    }
  }

  private aplicarDelirio(texto: string): string {
    const frases = [
      "Pero esto es completamente falso.",
      "Aunque nadie puede confirmarlo.",
      "Esto contradice todo lo anterior.",
      "O tal vez no.",
      "Depende de la realidad que elijas."
    ];

    const partes = texto.split("\n\n");
    for (let i = 0; i < partes.length; i++) {
      if (Math.random() < 0.5) {
        partes[i] += "\n\n*" + frases[Math.floor(Math.random() * frases.length)] + "*";
      }
    }
    return partes.join("\n\n");
  }

  private limpiarParaImaginacion(texto: string): string {
    // ❌ eliminar links
    let t = texto.replace(/https?:\/\/\S+/g, "");
    // ❌ eliminar [Reddit], [4chan/x]
    t = t.replace(/\[[^\]]+\]/g, "");
    // ❌ quitar markdown básico
    t = t.replace(/\*\*/g, "").replace(/\*/g, "").replace(/🔗/g, "");
    // ❌ quitar separadores
    t = t.replace(/---/g, "");
    // 🔥 opcional: hacerlo más "fluido"
    t = t.replace(/\n\n/g, "\n");

    return t.trim();
  }

  private showThinking(): string {
    const id = 'thinking-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message bot thinking-msg';
    div.innerHTML = `
      <div class="thinking">
        analizando
        <div class="dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
    this.chatMessages.appendChild(div);
    this.scrollToBottom();
    return id;
  }

  private removeThinking(id: string) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  private addMessageInstant(text: string, isUser: boolean) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'bot'}`;
    
    div.innerHTML = `
      <div class="bubble">${this.parseMarkdown(text)}</div>
    `;
    
    this.chatMessages.appendChild(div);
    this.scrollToBottom();
  }

  private async addMessageTyping(text: string) {
    const div = document.createElement('div');
    div.className = `message bot`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    div.appendChild(bubble);
    this.chatMessages.appendChild(div);

    let currentText = "";
    const speed = 5;

    // We process simple markdown during typing by updating innerHTML
    // but char by char for effect.
    for (let i = 0; i < text.length; i++) {
      currentText += text[i];
      bubble.innerHTML = this.parseMarkdown(currentText);
      this.scrollToBottom();
      await new Promise(r => setTimeout(r, speed));
    }
  }

  private parseMarkdown(text: string): string {
    let t = text.trim();
    
    // Links
    t = t.replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
    
    // Bold **text**
    t = t.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    
    // Italic *text*
    t = t.replace(/\*(.*?)\*/g, '<i>$1</i>');
    
    // Greentext >text
    const lines = t.split('\n');
    const processedLines = lines.map(line => {
      if (line.trim().startsWith('>')) {
        return `<span class="greentext">${line}</span>`;
      }
      return line;
    });
    
    return processedLines.join('\n');
  }

  private scrollToBottom() {
    this.chatMessages.parentElement!.scrollTop = this.chatMessages.parentElement!.scrollHeight;
  }
}

new GRCB();
