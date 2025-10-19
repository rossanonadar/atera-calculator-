<?php
/**
 * Plugin Name:       Atera Compact Calculator
 * Description:       Provides the "Atera Compact Calculator" Gutenberg block for estimating savings.
 * Version:           1.0.0
 * Author:            Atera
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 */
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
// Define plugin file constant. 
if ( ! defined( 'ATERA_CALC_PLUGIN_FILE' ) ) {
    define( 'ATERA_CALC_PLUGIN_FILE', __FILE__ ); // Define the plugin file constant
}

require_once plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/init.php';
require_once plugin_dir_path( ATERA_CALC_PLUGIN_FILE ) . 'includes/render.php';
