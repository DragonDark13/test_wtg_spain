import $ from 'jquery';
import "select2"
import {Modal} from "bootstrap"

$(document).ready(function () {

    if (module.hot) {
        module.hot.accept();
    }

    const $body = $('body');
    const $realEstateTable = $body.find('.real_estate_table');
    const $controlPanel = $realEstateTable.find('.all_tr_control_panel');
    const $allPrice = $controlPanel.find(".all_price");
    const $allType = $controlPanel.find(".all_type");
    const $allCity = $controlPanel.find(".all_city");
    const $confirmationModal = new Modal($('.confirmation_modal'));
    const $nonUniqueModal = new Modal($('#nonUniqueModal'));
    const $successModal = new Modal($('#successModal'));
    const $deleteConfirmationModal = new Modal($('#deleteConfirmationModal'));

    const dataUrl = {
        city: "http://localhost:3001/cities",
        type: 'http://localhost:3001/types',
        rows: 'http://localhost:3001/dataRows',
    }

    const bindEventHandlers = () => {
        $controlPanel.on('change', '.all_price, .all_city, .all_type', editAll);
        $('.confirmation_modal').on('click', '.confirm_edit_all_btn', confirmEditAll);
        $(".confirmation_modal").on('click', '.cancel_edit_all_btn', cancelEditAllField);
        $body.find('.save_button').on('click', saveData);
        $body.find('.add_new_row').on('click', addEmptyRow);
    };

    const initialize = () => {
        clearControlPanelFields();
        bindEventHandlers();
        initSimplyTableRows();
        initializeSelect2WithData($allCity, dataUrl.city, 'Change all city fields');
        initializeSelect2WithData($allType, dataUrl.type, 'Change all type fields');
    };

    const editAll = () => {
        $confirmationModal.show();
    };

    const confirmEditAll = () => {
        let allPriceValue = $allPrice.val();
        let allCityValue = $allCity.val();
        let allTypeValue = $allType.val();

        $('tbody tr.simply_tr').each(() => {
            const $row = $(this);

            if (allPriceValue.trim() !== "") {
                $row.find('.price_input').val(allPriceValue);
            }

            if (allCityValue.trim() !== "") {
                const $citySelect = $row.find('.city_select');
                $citySelect.val(allCityValue).trigger('change');
            }

            if (allTypeValue.trim() !== "") {
                const $typeSelect = $row.find('.type_select');
                $typeSelect.val(allTypeValue).trigger('change');
            }
        });

        clearControlPanelFields();
        $confirmationModal.hide();
    };

    const clearControlPanelFields = () => {
        $allPrice.val('');
        $allType.val('').trigger('change');
        $allCity.val('').trigger('change');
    };

    const cancelEditAllField = () => {
        clearControlPanelFields();
        $confirmationModal.hide();
    };

    const renderTableRow = (number, id, price, type, city) => {
        const rowHtml = `
        <tr class="simply_tr">
            <th scope="row">
                <input disabled class="form-control number_input" type="number" value="${number}">
            </th>
            <td>
                <input class="form-control id_input" type="text" value="${id}">
            </td>
            <td>
                <input class="form-control price_input" type="number" value="${price}">
            </td>
            <td>
                <select class="form-select city_select"></select>
            </td>
            <td>
                <select class="form-select type_select"></select>
            </td>
            <td>
                <button type="button" class="btn btn-primary btn-copy">Copy</button>
                <button type="button" class="btn btn-danger btn-delete">Delete</button>
            </td>
        </tr>
    `;

        const $row = $(rowHtml).appendTo('.real_estate_table tbody');
        $row.on('click', '.btn-delete', deleteRow);
        $row.on('click', '.btn-copy', copyRow);

        initializeSelect2WithData($row.find('.city_select'), dataUrl.city, 'City', city);
        initializeSelect2WithData($row.find('.type_select'), dataUrl.type, 'Type', type);
    };

    const initSimplyTableRows = () => {
        $.ajax({
            url: dataUrl.rows,
            type: 'GET',
            dataType: 'json',
            success: (data) => {
                data.forEach((item, index) => {
                    renderTableRow(index + 1, item.id, item.price, item.type, item.city);
                });
            },
            error: (error) => {
                console.error('Error fetching data:', error);
            }
        });
    };

    const addEmptyRow = () => {
        const rowCount = $('.real_estate_table tbody tr.simply_tr').length + 1;
        renderTableRow(rowCount, "", "", "", "");
    };

    const initializeSelect2WithData = ($element, url, placeholder, selected) => {
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: (data) => {
                data.forEach((item) => {
                    $('<option>').val(item.id).text(item.name).appendTo($element);
                });

                $element.prepend($('<option>', {
                    value: '',
                    text: placeholder,
                    selected: !selected
                }));

                select2InitWithoutDataLoading($element, placeholder);
            },
            error: (error) => {
                console.error('Error fetching data:', error);
            }
        });
    };

    const select2InitWithoutDataLoading = ($element, placeholder) => {
        $element.select2({
            width: '100%',
            placeholder: placeholder,
        });
    };

    const oneRowSelects2InitWithoutDataLoading = (row) => {
        select2InitWithoutDataLoading($(row).find('.city_select'), 'City');
        select2InitWithoutDataLoading($(row).find('.type_select'), 'Type');
    };

    const deleteRow = (event) => {
        const $rowToDelete = $(event.currentTarget).closest('tr.simply_tr');
        $deleteConfirmationModal.show();

        $('#confirmDeleteBtn').one('click', () => {
            $rowToDelete.remove();
            $deleteConfirmationModal.hide();
        });
    };

    const copyRow = (event) => {
        const $originalRow = $(event.currentTarget).closest('tr.simply_tr'),
            cityValue = $originalRow.find('.city_select').val(),
            typeValue = $originalRow.find('.type_select').val();

        $originalRow.find('select').each(function () {
            const $select = $(this);
            const isSelect2Initialized = $select.hasClass('select2-hidden-accessible');

            if (isSelect2Initialized) {
                $select.select2('destroy');
            }
        });

        const $clonedRow = $originalRow.clone().find('.id_input').val('').end();

        $originalRow.after($clonedRow);

        oneRowSelects2InitWithoutDataLoading($originalRow);

        $clonedRow.on('click', '.btn-delete', deleteRow);
        $clonedRow.on('click', '.btn-copy', copyRow);
        $clonedRow.find('.city_select').val(cityValue);
        $clonedRow.find('.type_select').val(typeValue);
        select2InitWithoutDataLoading($clonedRow.find('.city_select'), 'City');
        select2InitWithoutDataLoading($clonedRow.find('.type_select'), 'Type');
    };

    const saveData = () => {
        const idSet = new Set();
        let isUniqueId = true;
        let listAllTableRow = $('tbody tr.simply_tr');
        let nonUniqueIdValue

        listAllTableRow.each(function () {
            const id = $(this).find('.id_input').val();

            if (idSet.has(id)) {
                nonUniqueIdValue = $(this).find('.id_input');
                isUniqueId = false;
                return false;
            }

            idSet.add(id);
        });

        if (!isUniqueId) {
            $nonUniqueModal.show();
            $nonUniqueModal._element.addEventListener('hidden.bs.modal', function () {
                nonUniqueIdValue.focus()
            });

        } else {
            console.log('data send');
            $successModal.show();
        }
    };

    initialize();
});