-- --------------------------------------------------------
-- Script de Criação do Banco de Dados para TCC Sistema de Chamados
-- --------------------------------------------------------

-- 1. Cria o banco de dados (se não existir)
CREATE DATABASE IF NOT EXISTS meu_tcc_db;

-- 2. Informa ao MySQL para usar esse banco
USE meu_tcc_db;

-- 3. Tabela de Usuários
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('usuario', 'analista', 'admin') NOT NULL 
);

-- 4. Tabela principal de Chamados
CREATE TABLE IF NOT EXISTS Tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Aberto', 'Em Andamento', 'Resolvido', 'Pendente') DEFAULT 'Aberto',
    category VARCHAR(50),
    urgency_ia ENUM('Crítica', 'Alta', 'Média', 'Baixa'),
    ia_confidence DECIMAL(3, 2) DEFAULT 0.80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    user_id INT, 
    analyst_id INT NULL, 
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (analyst_id) REFERENCES Users(id)
);

-- 5. Tabela para o histórico de interações (respostas)
CREATE TABLE IF NOT EXISTS TicketHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL, 
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES Tickets(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- 6. Inserir os usuários de demo
INSERT INTO Users (name, email, password, role) VALUES 
('João', 'joao@gmail.com', 'Joao123', 'analista'),
('Gabriel', 'gabriel@gmail.com', 'Gabriel123', 'usuario')
ON DUPLICATE KEY UPDATE name=name; -- Não faz nada se o email já existir

-- 7. Inserir chamados de demo (associados ao user_id = 2, o Gabriel)
INSERT INTO Tickets (title, description, category, urgency_ia, user_id, status) VALUES
('Meu PC não liga', 'Aperto o botão e nada acontece, nem a luz acende. Preciso de ajuda urgente.', 'Hardware', 'Crítica', 2, 'Aberto'),
('Impressora não funciona', 'Envio documentos mas eles ficam na fila e não imprimem.', 'Hardware', 'Média', 2, 'Aberto'),
('Solicitação de software', 'Gostaria de solicitar a instalação do Photoshop no meu notebook.', 'Software', 'Baixa', 2, 'Em Andamento')
ON DUPLICATE KEY UPDATE title=title; -- Não faz nada se o chamado já existir