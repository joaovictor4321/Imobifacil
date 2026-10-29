set names utf8mb4;

drop table if exists imovelComodidade;
drop table if exists imovel;
drop table if exists comodidade;
drop table if exists proprietario;
drop table if exists usuario;

create table usuario (
usuarioID int primary key auto_increment not null,
usuarioNome varchar(100) not null,
usuarioEmail varchar(100) not null unique,
usuarioTelefone varchar(20) not null,
usuarioSenha varchar(255) not null,
usuarioCriadoEm timestamp default current_timestamp
);

create table proprietario (
proprietarioID int primary key auto_increment not null,
proprietarioNome varchar(100) not null,
proprietarioCpf varchar(11) not null unique,
proprietarioTelefone varchar(20) not null
);

create table imovel (
imovelID int primary key auto_increment not null,
imovelTitulo varchar(100) not null,
imovelDescricao text,
imovelTipo varchar(50) not null,
imovelFinalidade enum('venda','aluguel') not null,
imovelStatus enum('disponivel','vendido','alugado') not null default 'disponivel',
imovelPreco decimal(12,2) not null,
imovelArea decimal(8,2) not null,
imovelQuartos int not null default 0,
imovelBanheiros int not null default 0,
imovelVagas int not null default 0,
imovelEndereco varchar(150) not null,
imovelBairro varchar(80) not null,
imovelImagemUrl varchar(255),
imovelCriadoEm timestamp default current_timestamp,
imovelProprietarioIDFK int not null,
imovelUsuarioIDFK int not null,
foreign key (imovelProprietarioIDFK) references proprietario(proprietarioID),
foreign key (imovelUsuarioIDFK) references usuario(usuarioID) on delete cascade
);

create table comodidade (
comodidadeID int primary key auto_increment not null,
comodidadeNome varchar(40) not null unique
);

create table imovelComodidade (
imovelComodidadeImovelIDFK int not null,
imovelComodidadeComodidadeIDFK int not null,
primary key (imovelComodidadeImovelIDFK, imovelComodidadeComodidadeIDFK),
foreign key (imovelComodidadeImovelIDFK) references imovel(imovelID) on delete cascade,
foreign key (imovelComodidadeComodidadeIDFK) references comodidade(comodidadeID) on delete cascade
);

insert into usuario (usuarioNome, usuarioEmail, usuarioTelefone, usuarioSenha) values
('Lucas Bernardes', 'lucas@imobifacil.com', '(19) 99999-1001', '$2b$10$xm9BSV8iMxTpyw3bt/9UiOhLRTP2MbuOGZvy84lipdldH0/P/hl/O'),
('Matheus Caetano', 'matheus@imobifacil.com', '(19) 99999-1002', '$2b$10$xm9BSV8iMxTpyw3bt/9UiOhLRTP2MbuOGZvy84lipdldH0/P/hl/O'),
('Ana Souza', 'ana@imobifacil.com', '(19) 99999-1003', '$2b$10$xm9BSV8iMxTpyw3bt/9UiOhLRTP2MbuOGZvy84lipdldH0/P/hl/O'),
('Bruno Lima', 'bruno@imobifacil.com', '(19) 99999-1004', '$2b$10$xm9BSV8iMxTpyw3bt/9UiOhLRTP2MbuOGZvy84lipdldH0/P/hl/O'),
('Carla Mendes', 'carla@imobifacil.com', '(19) 99999-1005', '$2b$10$xm9BSV8iMxTpyw3bt/9UiOhLRTP2MbuOGZvy84lipdldH0/P/hl/O');

insert into proprietario (proprietarioNome, proprietarioCpf, proprietarioTelefone) values
('Roberto Almeida', '11122233344', '(19) 98888-2001'),
('Fernanda Costa', '22233344455', '(19) 98888-2002'),
('José Pereira', '33344455566', '(19) 98888-2003'),
('Mariana Lopes', '44455566677', '(19) 98888-2004'),
('Paulo Henrique', '55566677788', '(19) 98888-2005');

insert into comodidade (comodidadeNome) values
('Piscina'), ('Churrasqueira'), ('Academia'), ('Portaria 24h'), ('Aceita pet'), ('Mobiliado');

insert into imovel (imovelTitulo, imovelDescricao, imovelTipo, imovelFinalidade, imovelStatus, imovelPreco, imovelArea, imovelQuartos, imovelBanheiros, imovelVagas, imovelEndereco, imovelBairro, imovelProprietarioIDFK, imovelUsuarioIDFK) values
('Apartamento 2 quartos no Cambuí', 'Apartamento reformado, sol da manhã, perto de padarias e do Centro de Convivência.', 'Apartamento', 'aluguel', 'disponivel', 2800.00, 68.00, 2, 2, 1, 'Rua Coronel Quirino, 1200', 'Cambuí', 1, 1),
('Casa térrea com quintal', 'Casa ampla com quintal gramado e edícula nos fundos.', 'Casa', 'venda', 'disponivel', 750000.00, 180.00, 3, 2, 2, 'Rua das Palmeiras, 85', 'Taquaral', 2, 1),
('Kitnet perto da Unicamp', 'Ideal para estudantes. Conta de água inclusa.', 'Kitnet', 'aluguel', 'alugado', 1200.00, 28.00, 1, 1, 0, 'Av. Albino J. B. de Oliveira, 900', 'Barão Geraldo', 3, 2),
('Terreno em condomínio', 'Terreno plano em condomínio fechado com área verde.', 'Terreno', 'venda', 'disponivel', 420000.00, 450.00, 0, 0, 0, 'Estrada da Cachoeira, km 3', 'Sousas', 4, 3),
('Sala comercial no Centro', 'Sala com recepção, 2 ambientes e copa. Prédio com elevador.', 'Sala comercial', 'aluguel', 'disponivel', 1900.00, 45.00, 0, 1, 1, 'Rua Barão de Jaguara, 1400', 'Centro', 5, 4),
('Cobertura duplex', 'Cobertura com terraço gourmet e vista para o Taquaral.', 'Apartamento', 'venda', 'disponivel', 1350000.00, 220.00, 3, 4, 3, 'Av. Heitor Penteado, 500', 'Taquaral', 1, 5),
('Chácara com piscina', 'Chácara para lazer com pomar, piscina e salão de festas.', 'Chácara', 'venda', 'vendido', 980000.00, 2500.00, 4, 3, 6, 'Rua dos Ipês, 30', 'Sousas', 2, 2),
('Casa em Nova Campinas', 'Casa de alto padrão com jardim e área de lazer completa.', 'Casa', 'aluguel', 'disponivel', 9500.00, 380.00, 4, 5, 4, 'Rua Sampainho, 210', 'Nova Campinas', 3, 4);

insert into imovelComodidade (imovelComodidadeImovelIDFK, imovelComodidadeComodidadeIDFK) values
(1, 4), (1, 5), (2, 2), (2, 5), (3, 6), (6, 1), (6, 2), (6, 3), (6, 4), (7, 1), (7, 2), (8, 1), (8, 2), (8, 5);

select i.imovelID, i.imovelTitulo, i.imovelTipo, i.imovelFinalidade, i.imovelPreco, i.imovelBairro, u.usuarioNome
from imovel i
join usuario u on u.usuarioID = i.imovelUsuarioIDFK
order by i.imovelCriadoEm desc;

select imovelTitulo, imovelPreco from imovel
where imovelFinalidade = 'aluguel' and imovelStatus = 'disponivel'
and imovelTipo = 'Apartamento' and imovelPreco <= 3000
order by imovelPreco;

select ic.imovelComodidadeImovelIDFK as imovelID, c.comodidadeNome
from imovelComodidade ic
join comodidade c on c.comodidadeID = ic.imovelComodidadeComodidadeIDFK
order by c.comodidadeNome;

select i.imovelID, i.imovelTitulo, i.imovelStatus, p.proprietarioNome
from imovel i
join proprietario p on p.proprietarioID = i.imovelProprietarioIDFK
where i.imovelUsuarioIDFK = 1;

select imovelStatus, count(*) as total from imovel group by imovelStatus;
