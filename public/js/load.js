async function getAdmin() {
    const response = await fetch("/auth/admin_consultAdm");
    const data = await response.json();
    const listaAdministradores = document.getElementById("listaAdministradores");
  
    for (administrador of data) {
      const root = document.createElement("div");
      const nome = document.createElement("div");
      const email = document.createElement(`div`);
  
      nome.textContent = `Nome do Administrador: ${administrador.name}`;
      email.textContent = `E-mail: ${administrador.email}`;
      root.append(nome, email);
      listaAdministradores.append(root);
    }
    console.log(listaAdministradores);
  }

