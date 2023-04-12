-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 21-03-2023 a las 16:04:33
-- Versión del servidor: 10.3.15-MariaDB
-- Versión de PHP: 7.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `actualizador`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `puntos`
--

CREATE TABLE `puntos` (
  `IP` varchar(15) NOT NULL,
  `NOMBRE` varchar(45) NOT NULL,
  `ZONA` enum('NORTE','CENTRO','SUR','DAGUA','RURAL') NOT NULL,
  `CONEXION` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `puntos`
--

INSERT INTO `puntos` (`IP`, `NOMBRE`, `ZONA`, `CONEXION`) VALUES
('10.120.11.85', 'CHONTICO', 'NORTE', ''),
('172.16.20.111', 'Principal E1', 'NORTE', 'IP'),
('172.16.20.115', 'CHORLAVI EQUIPO 2', 'NORTE', ''),
('192.168.41.13', 'DEMO', 'NORTE', 'IP');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro`
--

CREATE TABLE `registro` (
  `ID` int(11) NOT NULL,
  `PUNTOS_IP` varchar(255) NOT NULL,
  `TIPO_ACTUALIZACION_ID` int(11) NOT NULL,
  `FECHA` date NOT NULL,
  `HORA_INICIO` varchar(255) NOT NULL,
  `HORA_FIN` varchar(255) DEFAULT NULL,
  `ESTADO` enum('Procesando','Finalizado','Incompleto') NOT NULL,
  `RUTA` text NOT NULL,
  `TAMANIO_TOTAL` varchar(100) NOT NULL COMMENT 'Peso en MegaByte',
  `OBSERVACION` text NOT NULL,
  `TAMANIO_PARCIAL` varchar(200) NOT NULL COMMENT 'Peso en MegaByte',
  `PORCENTAJE` double NOT NULL,
  `ERROR` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `registro`
--

INSERT INTO `registro` (`ID`, `PUNTOS_IP`, `TIPO_ACTUALIZACION_ID`, `FECHA`, `HORA_INICIO`, `HORA_FIN`, `ESTADO`, `RUTA`, `TAMANIO_TOTAL`, `OBSERVACION`, `TAMANIO_PARCIAL`, `PORCENTAJE`, `ERROR`) VALUES
(1, '192.168.41.13', 1, '2023-03-18', '13:56:49', '13:57:00', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '118.60', 100, ''),
(2, '192.168.41.13', 5, '2023-03-18', '13:57:11', '13:57:12', 'Finalizado', '/home/gamble/prueba-ftp/App boton de panico.zip', '9.90', 'Boton de panico', '9.90', 100, ''),
(3, '192.168.41.13', 5, '2023-03-18', '14:04:30', '14:04:42', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', 'Boton de panico', '118.60', 100, ''),
(4, '192.168.41.13', 1, '2023-03-21', '8:48:25', '8:48:39', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', 'fgfdgfdgfdgfd', '118.60', 100, ''),
(5, '172.16.20.115', 1, '2023-03-21', '8:48:25', '8:48:47', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', 'fgfdgfdgfdgfd', '118.60', 100, ''),
(6, '192.168.41.13', 1, '2023-03-21', '8:50:43', '8:50:58', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '118.60', 100, ''),
(7, '172.16.20.115', 1, '2023-03-21', '8:50:43', '8:51:05', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '118.60', 100, ''),
(8, '192.168.41.13', 1, '2023-03-21', '8:53:05', '8:53:18', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '118.60', 100, ''),
(9, '172.16.20.115', 1, '2023-03-21', '8:53:05', '8:53:26', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '118.60', 100, ''),
(10, '192.168.41.13', 1, '2023-03-21', '9:02:39', '9:02:54', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '118.60', 100, ''),
(11, '172.16.20.115', 1, '2023-03-21', '9:02:39', '9:03:03', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '118.60', 100, ''),
(12, '10.120.11.85', 1, '2023-03-21', '9:02:39', '9:03:24', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '118.60', 100, ''),
(13, '192.168.41.13', 1, '2023-03-21', '9:03:47', NULL, 'Procesando', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '', 0, ''),
(14, '192.168.41.13', 1, '2023-03-21', '9:04:27', '9:05:53', 'Finalizado', '/home/gamble/prueba-ftp/actualizador.zip', '118.60', '', '118.60', 100, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_actualizacion`
--

CREATE TABLE `tipo_actualizacion` (
  `ID` int(11) NOT NULL,
  `CATEGORIA` varchar(45) NOT NULL,
  `SUB_CATEGORIA` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Volcado de datos para la tabla `tipo_actualizacion`
--

INSERT INTO `tipo_actualizacion` (`ID`, `CATEGORIA`, `SUB_CATEGORIA`) VALUES
(1, 'Businessnet', 'Businessnet 4.0'),
(2, 'Businessnet', 'Businessnet 4.1'),
(3, 'Jar', 'Pata Millonaria'),
(4, 'Jar', 'Baloto'),
(5, 'Desarrollo', 'Biometrico'),
(6, 'Desarrollo', 'Boton Panico'),
(7, 'Jar', 'Giros');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `puntos`
--
ALTER TABLE `puntos`
  ADD PRIMARY KEY (`IP`);

--
-- Indices de la tabla `registro`
--
ALTER TABLE `registro`
  ADD PRIMARY KEY (`ID`) USING BTREE,
  ADD KEY `TIPO_ACTUALIZACION_ID` (`TIPO_ACTUALIZACION_ID`);

--
-- Indices de la tabla `tipo_actualizacion`
--
ALTER TABLE `tipo_actualizacion`
  ADD PRIMARY KEY (`ID`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `registro`
--
ALTER TABLE `registro`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `tipo_actualizacion`
--
ALTER TABLE `tipo_actualizacion`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
