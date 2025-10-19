<?php
/**
 * Core hooks and bootstrap for the Atera Compact Calculator block.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/config.php';
require_once plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/settings.php';
require_once plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/block.php';
require_once plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/rest.php';
